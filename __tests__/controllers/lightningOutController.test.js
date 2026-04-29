jest.mock('axios');
jest.mock('../../src/utils/helpers', () => ({
  handleAxiosError: jest.fn()
}));

const axios = require('axios');
const lightningOutController = require('../../src/controllers/lightningOutController');
const { handleAxiosError } = require('../../src/utils/helpers');

const mockRes = () => {
  const res = {};
  res.redirect = jest.fn();
  res.render = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => {
  const base = { query: {}, session: { lightningOutState: 'mock_state' } };
  return { ...base, ...overrides };
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SF_CLIENT_ID_LO = 'test_client_id';
  process.env.SF_CLIENT_SECRET_LO = 'test_client_secret';
  process.env.REDIRECT_URI = 'https://app.example.com/lightningoutcallback';
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

  test('includes encoded redirect_uri in auth URL', () => {
    const res = mockRes();
    lightningOutController.renderLwc(mockReq(), res);

    const url = res.redirect.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent('https://app.example.com/lightningoutcallback'));
  });
});

describe('callback', () => {
  test('renders lightningout view on success', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'tok123', instance_url: 'https://clintoxsupport.my.salesforce.com' }
    });
    axios.get.mockResolvedValue({
      data: { frontdoor_uri: 'https://clintoxsupport.my.salesforce.com/secur/frontdoor.jsp?sid=tok' }
    });

    const req = mockReq({
      query: { code: 'authcode123', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        regenerate: jest.fn((cb) => cb(null))
      }
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    expect(res.render).toHaveBeenCalledWith('lightningout', expect.objectContaining({
      frontdoorUrl: expect.stringContaining('https://'),
      instanceUrl: expect.any(String),
      appId: expect.any(String),
      user: expect.objectContaining({ name: expect.any(String) })
    }));
  });

  test('prepends https:// when frontdoor_uri is missing scheme', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'tok', instance_url: 'https://clintoxsupport.my.salesforce.com' }
    });
    axios.get.mockResolvedValue({
      data: { frontdoor_uri: 'clintoxsupport.my.salesforce.com/secur/frontdoor.jsp' }
    });

    const req = mockReq({
      query: { code: 'code', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        regenerate: jest.fn((cb) => cb(null))
      }
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
        regenerate: jest.fn((cb) => cb(null))
      }
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Lightning Out callback');
  });

  test('sends correct token exchange params', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'tok', instance_url: 'https://clintoxsupport.my.salesforce.com' }
    });
    axios.get.mockResolvedValue({
      data: { frontdoor_uri: 'https://clintoxsupport.my.salesforce.com/door' }
    });

    const req = mockReq({
      query: { code: 'mycode', state: 'mock_state' },
      session: {
        lightningOutState: 'mock_state',
        regenerate: jest.fn((cb) => cb(null))
      }
    });
    const res = mockRes();

    await lightningOutController.callback(req, res);

    const postedParams = axios.post.mock.calls[0][1];
    expect(postedParams.get('grant_type')).toBe('authorization_code');
    expect(postedParams.get('code')).toBe('mycode');
    expect(postedParams.get('client_id')).toBe('test_client_id');
    expect(postedParams.get('client_secret')).toBe('test_client_secret');
  });
});
