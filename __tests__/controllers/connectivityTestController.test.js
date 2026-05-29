jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  buildUrl: jest.fn((base, params) => `${base}?${new URLSearchParams(params).toString()}`),
  handleAxiosError: jest.fn()
}));

const connectivityTestController = require('../../src/controllers/connectivityTestController');
const sfService = require('../../src/services/salesforceService');
const { handleAxiosError } = require('../../src/utils/helpers');

const mockReq = (body = {}, session = {}) => ({ body, session });
const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('showPage', () => {
  test('renders connectivityTest with null result and error', () => {
    const res = mockRes();
    connectivityTestController.showPage({}, res);
    expect(res.render).toHaveBeenCalledWith('connectivityTest', { result: null, error: null });
  });
});

describe('runTest', () => {
  test('renders error when all fields are missing', async () => {
    const res = mockRes();
    await connectivityTestController.runTest(mockReq({}), res);
    expect(res.render).toHaveBeenCalledWith('connectivityTest', {
      result: null,
      error: 'All fields are required.'
    });
  });

  test('renders error when clientId is missing', async () => {
    const res = mockRes();
    await connectivityTestController.runTest(
      mockReq({ clientSecret: 'sec', instanceUrl: 'https://myorg.my.salesforce.com' }),
      res
    );
    expect(res.render).toHaveBeenCalledWith('connectivityTest', {
      result: null,
      error: 'All fields are required.'
    });
  });

  test('renders error for invalid instance URL', async () => {
    const res = mockRes();
    await connectivityTestController.runTest(
      mockReq({ clientId: 'id', clientSecret: 'sec', instanceUrl: 'https://notasalesforce.example.com' }),
      res
    );
    expect(res.render).toHaveBeenCalledWith('connectivityTest', {
      result: null,
      error: expect.stringContaining('valid Salesforce domain')
    });
  });

  test('redirects to Salesforce authorization endpoint on valid input', async () => {
    const res = mockRes();
    const session = {};
    await connectivityTestController.runTest(
      mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com/' }, session),
      res
    );
    expect(res.redirect).toHaveBeenCalled();
    const redirectUrl = res.redirect.mock.calls[0][0];
    expect(redirectUrl).toContain('https://myorg.my.salesforce.com/services/oauth2/authorize');
    expect(redirectUrl).toContain('response_type=code');
    expect(redirectUrl).toContain('client_id=cid');
  });

  test('stores OAuth context in session on valid input', async () => {
    const res = mockRes();
    const session = {};
    await connectivityTestController.runTest(
      mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com/' }, session),
      res
    );
    expect(session.byocaTokenEndpoint).toBe('https://myorg.my.salesforce.com/services/oauth2/token');
    expect(session.byocaInstanceUrl).toBe('https://myorg.my.salesforce.com');
    expect(session.byocaClientId).toBe('cid');
    expect(session.byocaClientSecret).toBe('csec');
    expect(session.oauthState).toBeDefined();
  });
});

describe('callbackByoca', () => {
  const buildReq = (query = {}, session = {}) => ({ query, session });

  test('renders error when authorization error in query', async () => {
    const res = mockRes();
    await connectivityTestController.callbackByoca(
      buildReq({ error: 'access_denied' }, {}),
      res
    );
    expect(res.render).toHaveBeenCalledWith('error', { error: 'Authorization error' });
  });

  test('renders error on state mismatch', async () => {
    const res = mockRes();
    await connectivityTestController.callbackByoca(
      buildReq({ code: 'abc', state: 'wrong' }, { oauthState: 'correct' }),
      res
    );
    expect(res.render).toHaveBeenCalledWith('error', { error: 'State mismatch' });
  });

  test('calls testConnectivity and renders result on success', async () => {
    const result = { tokenAcquired: true, recordCount: 2, instanceUrl: 'https://myorg.my.salesforce.com' };
    sfService.testConnectivity.mockResolvedValue(result);
    const session = {
      oauthState: 'abc123',
      byocaTokenEndpoint: 'https://myorg.my.salesforce.com/services/oauth2/token',
      byocaInstanceUrl: 'https://myorg.my.salesforce.com',
      byocaClientId: 'cid',
      byocaClientSecret: 'csec',
    };
    const res = mockRes();
    await connectivityTestController.callbackByoca(
      buildReq({ code: 'authcode', state: 'abc123' }, session),
      res
    );
    expect(sfService.testConnectivity).toHaveBeenCalledWith(
      'https://myorg.my.salesforce.com/services/oauth2/token',
      { client_id: 'cid', client_secret: 'csec', redirect_uris: ['https://clintox.xyz/auth/callbackbyoca'] },
      'https://myorg.my.salesforce.com',
      'authcode'
    );
    expect(res.render).toHaveBeenCalledWith('connectivityTest', { result, error: null });
  });

  test('clears byoca session keys after callback', async () => {
    sfService.testConnectivity.mockResolvedValue({ tokenAcquired: true, recordCount: 0, instanceUrl: 'x' });
    const session = {
      oauthState: 'abc123',
      byocaTokenEndpoint: 'endpoint',
      byocaInstanceUrl: 'url',
      byocaClientId: 'cid',
      byocaClientSecret: 'csec',
    };
    await connectivityTestController.callbackByoca(
      buildReq({ code: 'authcode', state: 'abc123' }, session),
      mockRes()
    );
    expect(session.byocaTokenEndpoint).toBeUndefined();
    expect(session.byocaInstanceUrl).toBeUndefined();
    expect(session.byocaClientId).toBeUndefined();
    expect(session.byocaClientSecret).toBeUndefined();
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('network error');
    sfService.testConnectivity.mockRejectedValue(err);
    const res = mockRes();
    const session = {
      oauthState: 'abc123',
      byocaTokenEndpoint: 'endpoint',
      byocaInstanceUrl: 'url',
      byocaClientId: 'cid',
      byocaClientSecret: 'csec',
    };
    await connectivityTestController.callbackByoca(
      buildReq({ code: 'authcode', state: 'abc123' }, session),
      res
    );
    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Connectivity test');
  });
});
