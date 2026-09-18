jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  buildUrl: jest.fn(() => 'https://auth.example.com/authorize?mocked=true'),
  handleAxiosError: jest.fn()
}));

const authController = require('../../src/controllers/authController');
const sfService = require('../../src/services/salesforceService');
const { buildUrl, handleAxiosError } = require('../../src/utils/helpers');

const ORG_CONFIG = {
  instanceUrl: 'https://myorg.my.salesforce.com',
  clientId: 'client123',
  siteUrl: 'https://myorg.my.site.com/portal',
};

const mockReq = (overrides = {}) => {
  const base = {
    session: { orgConfig: ORG_CONFIG },
    query: {},
  };
  const merged = { ...base, ...overrides };
  if (!merged.session.regenerate) {
    merged.session.regenerate = jest.fn((cb) => cb(null));
  }
  return merged;
};

const mockRes = () => ({
  redirect: jest.fn(),
  render: jest.fn(),
  attachment: jest.fn(),
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── startAuth ──────────────────────────────────────────────────────────────

describe('startAuth', () => {
  test('redirects to /setup when orgConfig is missing', () => {
    const req = mockReq({ session: { orgConfig: null, regenerate: jest.fn((cb) => cb(null)) } });
    const res = mockRes();
    authController.startAuth(req, res, 'standard');
    expect(res.redirect).toHaveBeenCalledWith('/setup');
  });

  test('stores generated state in session', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'standard');
    expect(req.session.oauthState).toMatch(/^[0-9a-f]{64}$/);
  });

  test('stores authType in session', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'site');
    expect(req.session.authType).toBe('site');
  });

  test('calls buildUrl with instanceUrl authorize endpoint for standard type', () => {
    authController.startAuth(mockReq(), mockRes(), 'standard');
    expect(buildUrl).toHaveBeenCalledWith(
      `${ORG_CONFIG.instanceUrl}/services/oauth2/authorize`,
      expect.any(Object)
    );
  });

  test('calls buildUrl with siteUrl authorize endpoint for site type', () => {
    authController.startAuth(mockReq(), mockRes(), 'site');
    expect(buildUrl).toHaveBeenCalledWith(
      `${ORG_CONFIG.siteUrl}/services/oauth2/authorize`,
      expect.any(Object)
    );
  });

  test('uses orgConfig.clientId in buildUrl params', () => {
    authController.startAuth(mockReq(), mockRes(), 'standard');
    const params = buildUrl.mock.calls[0][1];
    expect(params.client_id).toBe(ORG_CONFIG.clientId);
  });

  test('uses code response_type', () => {
    authController.startAuth(mockReq(), mockRes(), 'standard');
    const params = buildUrl.mock.calls[0][1];
    expect(params.response_type).toBe('code');
  });

  test('calls res.redirect with the built URL', () => {
    const res = mockRes();
    authController.startAuth(mockReq(), res, 'standard');
    expect(res.redirect).toHaveBeenCalledWith('https://auth.example.com/authorize?mocked=true');
  });

  test('includes state in buildUrl params', () => {
    authController.startAuth(mockReq(), mockRes(), 'standard');
    const params = buildUrl.mock.calls[0][1];
    expect(params.state).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── callback ───────────────────────────────────────────────────────────────

describe('callback', () => {
  test('renders error view when req.query.error is present', async () => {
    const req = mockReq({ query: { error: 'access_denied', state: 'x' } });
    const res = mockRes();
    await authController.callback(req, res);
    expect(res.render).toHaveBeenCalledWith('error', { error: 'Authorization error' });
  });

  test('renders error view on state mismatch', async () => {
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'correct_state', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'wrong_state' }
    });
    const res = mockRes();
    await authController.callback(req, res);
    expect(res.render).toHaveBeenCalledWith('error', { error: 'State mismatch' });
  });

  test('redirects to /setup when orgConfig missing', async () => {
    const req = mockReq({
      session: { orgConfig: null, oauthState: 'st', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();
    await authController.callback(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/setup');
  });

  test('successful default flow — renders clientindex with access_token and orgConfig', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok123', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(res.render).toHaveBeenCalledWith('clientindex', expect.objectContaining({ access_token: 'tok123' }));
  });

  test('stores instance_url from token response in session', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({
      access_token: 'tok123',
      instance_url: 'https://myorg.my.salesforce.com',
    });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });

    await authController.callback(req, mockRes());

    expect(req.session.instanceUrl).toBe('https://myorg.my.salesforce.com');
  });

  test('createAccount flow — redirects to /createaccount', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', action: 'createAccount', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/createaccount');
  });

  test('downloadReport flow — redirects to /serveReport', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', action: 'report', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/serveReport');
  });

  test('calls handleAxiosError when service throws', async () => {
    const err = new Error('token failed');
    sfService.getTokenAuthCode.mockRejectedValue(err);
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Callback');
  });

  test('uses instanceUrl token endpoint for standard authType', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', authType: 'standard', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });

    await authController.callback(req, mockRes());

    expect(sfService.getTokenAuthCode).toHaveBeenCalledWith(
      'code',
      `${ORG_CONFIG.instanceUrl}/services/oauth2/token`,
      expect.any(Object)
    );
  });

  test('uses siteUrl token endpoint for site authType', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, oauthState: 'st', authType: 'site', regenerate: jest.fn((cb) => cb(null)) },
      query: { code: 'code', state: 'st' }
    });

    await authController.callback(req, mockRes());

    expect(sfService.getTokenAuthCode).toHaveBeenCalledWith(
      'code',
      `${ORG_CONFIG.siteUrl}/services/oauth2/token`,
      expect.any(Object)
    );
  });
});

// ── startClientCredentialsFlow ─────────────────────────────────────────────

describe('startClientCredentialsFlow', () => {
  test('redirects to /setup when orgConfig is missing', async () => {
    const req = mockReq({ session: { orgConfig: null, regenerate: jest.fn((cb) => cb(null)) } });
    const res = mockRes();
    await authController.startClientCredentialsFlow(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/setup');
  });

  test('renders clientindex on success', async () => {
    sfService.getTokenClientCreds.mockResolvedValue({ access_token: 'cc_tok', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, regenerate: jest.fn((cb) => cb(null)) },
    });
    const res = mockRes();

    await authController.startClientCredentialsFlow(req, res);

    expect(res.render).toHaveBeenCalledWith('clientindex', expect.objectContaining({ access_token: 'cc_tok' }));
  });

  test('calls getTokenClientCreds with instanceUrl token endpoint and orgConfig credentials', async () => {
    sfService.getTokenClientCreds.mockResolvedValue({ access_token: 'tok', instance_url: 'https://myorg.my.salesforce.com' });
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, regenerate: jest.fn((cb) => cb(null)) },
    });

    await authController.startClientCredentialsFlow(req, mockRes());

    expect(sfService.getTokenClientCreds).toHaveBeenCalledWith(
      `${ORG_CONFIG.instanceUrl}/services/oauth2/token`,
      { client_id: ORG_CONFIG.clientId }
    );
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('creds failed');
    sfService.getTokenClientCreds.mockRejectedValue(err);
    const req = mockReq({
      session: { orgConfig: ORG_CONFIG, regenerate: jest.fn((cb) => cb(null)) },
    });
    const res = mockRes();

    await authController.startClientCredentialsFlow(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Client Credentials');
  });
});
