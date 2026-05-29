jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  buildUrl: jest.fn((base, params) => `${base}?${new URLSearchParams(params).toString()}`),
  handleAxiosError: jest.fn()
}));

const connectivityTestController = require('../../src/controllers/connectivityTestController');
const sfService = require('../../src/services/salesforceService');
const { handleAxiosError } = require('../../src/utils/helpers');

const mockReq = (body = {}, session = {}) => ({
  body,
  session: { ...session, save: jest.fn((cb) => cb(null)) },
});
const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  res.json = jest.fn();
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
  test('returns json error when all fields are missing', () => {
    const res = mockRes();
    connectivityTestController.runTest(mockReq({}), res);
    expect(res.json).toHaveBeenCalledWith({ error: 'All fields are required.' });
  });

  test('returns json error when clientId is missing', () => {
    const res = mockRes();
    connectivityTestController.runTest(
      mockReq({ clientSecret: 'sec', instanceUrl: 'https://myorg.my.salesforce.com' }),
      res
    );
    expect(res.json).toHaveBeenCalledWith({ error: 'All fields are required.' });
  });

  test('returns json error for invalid instance URL', () => {
    const res = mockRes();
    connectivityTestController.runTest(
      mockReq({ clientId: 'id', clientSecret: 'sec', instanceUrl: 'https://notasalesforce.example.com' }),
      res
    );
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('valid Salesforce domain') });
  });

  test('returns json redirectUrl to Salesforce authorization endpoint on valid input', () => {
    const res = mockRes();
    connectivityTestController.runTest(
      mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com/' }),
      res
    );
    expect(res.json).toHaveBeenCalled();
    const { redirectUrl } = res.json.mock.calls[0][0];
    expect(redirectUrl).toContain('https://myorg.my.salesforce.com/services/oauth2/authorize');
    expect(redirectUrl).toContain('response_type=code');
    expect(redirectUrl).toContain('client_id=cid');
  });

  test('stores OAuth context in session on valid input', () => {
    const res = mockRes();
    const req = mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com/' });
    connectivityTestController.runTest(req, res);
    expect(req.session.byocaTokenEndpoint).toBe('https://myorg.my.salesforce.com/services/oauth2/token');
    expect(req.session.byocaInstanceUrl).toBe('https://myorg.my.salesforce.com');
    expect(req.session.byocaClientId).toBe('cid');
    expect(req.session.byocaClientSecret).toBe('csec');
    expect(req.session.oauthState).toBeDefined();
  });
});

describe('callbackByoca', () => {
  const buildReq = (query = {}, session = {}) => ({
    query,
    session: { regenerate: jest.fn((cb) => cb(null)), ...session },
  });

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
      { client_id: 'cid', client_secret: 'csec', redirect_uris: ['https://clintox.xyz/callbackbyoca'] },
      'https://myorg.my.salesforce.com',
      'authcode'
    );
    expect(res.render).toHaveBeenCalledWith('connectivityTest', { result, error: null });
  });

  test('regenerates session to clear any prior auth state', async () => {
    sfService.testConnectivity.mockResolvedValue({ tokenAcquired: true, recordCount: 1, instanceUrl: 'https://myorg.my.salesforce.com' });
    const session = {
      oauthState: 'abc123',
      byocaTokenEndpoint: 'https://myorg.my.salesforce.com/services/oauth2/token',
      byocaInstanceUrl: 'https://myorg.my.salesforce.com',
      byocaClientId: 'cid',
      byocaClientSecret: 'csec',
    };
    const req = buildReq({ code: 'authcode', state: 'abc123' }, session);
    await connectivityTestController.callbackByoca(req, mockRes());
    expect(req.session.regenerate).toHaveBeenCalled();
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
    const req = buildReq({ code: 'authcode', state: 'abc123' }, session);
    await connectivityTestController.callbackByoca(req, mockRes());
    expect(req.session.byocaTokenEndpoint).toBeUndefined();
    expect(req.session.byocaInstanceUrl).toBeUndefined();
    expect(req.session.byocaClientId).toBeUndefined();
    expect(req.session.byocaClientSecret).toBeUndefined();
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
