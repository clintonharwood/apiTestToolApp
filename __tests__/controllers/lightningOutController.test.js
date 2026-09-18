jest.mock('axios');
jest.mock('../../src/utils/helpers', () => ({
  handleAxiosError: jest.fn()
}));

const axios = require('axios');
const lightningOutController = require('../../src/controllers/lightningOutController');
const { handleAxiosError } = require('../../src/utils/helpers');

const ORG_CONFIG = {
  instanceUrl: 'https://myorg.my.salesforce.com',
  clientId: 'test_client_id',
  lightningAppId: '1Us000000000000AAA',
};

const mockRes = () => {
  const res = {};
  res.redirect = jest.fn();
  res.render = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => {
  const base = {
    query: {},
    session: {
      lightningOutState: 'mock_state',
      orgConfig: ORG_CONFIG,
    },
  };
  return { ...base, ...overrides, session: { ...base.session, ...(overrides.session || {}) } };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('renderLwc', () => {
  test('redirects to Salesforce auth URL with client_id', () => {
    const res = mockRes();
    lightningOutController.renderLwc(mockReq(), res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const url = res.redirect.mock.calls[0][0];
    expect(url).toContain('client_id=test_client_id');
    expect(url).toContain('response_type=code');
  });

  test('includes instanceUrl in auth URL', () => {
    const res = mockRes();
    lightningOutController.renderLwc(mockReq(), res);

    const url = res.redirect.mock.calls[0][0];
    expect(url).toContain(ORG_CONFIG.instanceUrl);
  });

  test('redirects to /setup when orgConfig is missing', () => {
    const res = mockRes();
    lightningOutController.renderLwc(mockReq({ session: { orgConfig: null } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/setup');
  });

  test('renders error when lightningAppId is not configured', () => {
    const res = mockRes();
    lightningOutController.renderLwc(mockReq({ session: { orgConfig: { ...ORG_CONFIG, lightningAppId: null } } }), res);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ error: expect.stringContaining('Lightning App ID') }));
  });
});

describe('callback', () => {
  test('renders lightningout view on success', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'tok123', instance_url: 'https://myorg.my.salesforce.com' }
    });
    axios.get.mockResolvedValue({
      data: { frontdoor_uri: 'https://myorg.my.salesforce.com/secur/frontdoor.jsp?sid=tok' }
    });

    const req = mockReq({
      query: { code: 'authcode123', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        orgConfig: ORG_CONFIG,
        regenerate: jest.fn((cb) => cb(null)),
      },
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    expect(res.render).toHaveBeenCalledWith('lightningout', expect.objectContaining({
      frontdoorUrl: expect.stringContaining('https://'),
      instanceUrl: expect.any(String),
      appId: ORG_CONFIG.lightningAppId,
    }));
  });

  test('prepends https:// when frontdoor_uri is missing scheme', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' }
    });
    axios.get.mockResolvedValue({
      data: { frontdoor_uri: 'myorg.my.salesforce.com/secur/frontdoor.jsp' }
    });

    const req = mockReq({
      query: { code: 'code', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        orgConfig: ORG_CONFIG,
        regenerate: jest.fn((cb) => cb(null)),
      },
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    const { frontdoorUrl } = res.render.mock.calls[0][1];
    expect(frontdoorUrl.startsWith('https://')).toBe(true);
  });

  test('calls handleAxiosError on token exchange failure', async () => {
    const err = new Error('token exchange failed');
    axios.post.mockRejectedValue(err);

    const req = mockReq({
      query: { code: 'bad_code', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        orgConfig: ORG_CONFIG,
        regenerate: jest.fn((cb) => cb(null)),
      },
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Lightning Out callback');
  });

  test('sends correct token exchange params', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' }
    });
    axios.get.mockResolvedValue({
      data: { frontdoor_uri: 'https://myorg.my.salesforce.com/door' }
    });

    const req = mockReq({
      query: { code: 'mycode', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        orgConfig: ORG_CONFIG,
        regenerate: jest.fn((cb) => cb(null)),
      },
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    const postedParams = axios.post.mock.calls[0][1];
    expect(postedParams.get('grant_type')).toBe('authorization_code');
    expect(postedParams.get('code')).toBe('mycode');
    expect(postedParams.get('client_id')).toBe(ORG_CONFIG.clientId);
  });
});
