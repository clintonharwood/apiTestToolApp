jest.mock('randomstring', () => ({ generate: jest.fn(() => 'mock_state_value') }));
jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  buildUrl: jest.fn(() => 'https://auth.example.com/authorize?mocked=true'),
  handleAxiosError: jest.fn()
}));

const authController = require('../../src/controllers/authController');
const sfService = require('../../src/services/salesforceService');
const { buildUrl, handleAxiosError } = require('../../src/utils/helpers');
const randomstring = require('randomstring');
const authConfig = require('../../src/config/authConfig');

const mockReq = (overrides = {}) => {
  const base = {
    session: {},
    query: {},
    path: '/callback',
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
  send: jest.fn()
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── startAuth ──────────────────────────────────────────────────────────────

describe('startAuth', () => {
  test('stores generated state in session', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'one');
    expect(req.session.oauthState).toBe('mock_state_value');
  });

  test('type "one" — sets authServer to serverOne in session', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'one');
    expect(req.session.authServer).toBe('serverOne');
  });

  test('type "one" — calls buildUrl with authServerOne endpoint', () => {
    authController.startAuth(mockReq(), mockRes(), 'one');
    expect(buildUrl).toHaveBeenCalledWith(
      authConfig.endpoints.authServerOne.authorizationEndpoint,
      expect.any(Object)
    );
  });

  test('type "one" — stores oauthClientKey "one" in session', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'one');
    expect(req.session.oauthClientKey).toBe('one');
  });

  test('type "two" — sets authServer to serverTwo in session', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'two');
    expect(req.session.authServer).toBe('serverTwo');
  });

  test('type "two" — calls buildUrl with authServerTwo endpoint', () => {
    authController.startAuth(mockReq(), mockRes(), 'two');
    expect(buildUrl).toHaveBeenCalledWith(
      authConfig.endpoints.authServerTwo.authorizationEndpoint,
      expect.any(Object)
    );
  });

  test('type "three" — calls buildUrl with authServerThree endpoint', () => {
    authController.startAuth(mockReq(), mockRes(), 'three');
    expect(buildUrl).toHaveBeenCalledWith(
      authConfig.endpoints.authServerThree.authorizationEndpoint,
      expect.any(Object)
    );
  });

  test('type "three" — uses client four (oauthClientKey is "four")', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'three');
    expect(req.session.oauthClientKey).toBe('four');
  });

  test('type "three" — uses client_credentials response_type', () => {
    authController.startAuth(mockReq(), mockRes(), 'three');
    const params = buildUrl.mock.calls[0][1];
    expect(params.response_type).toBe('client_credentials');
  });

  test('type "reuse" — uses client three (oauthClientKey is "three")', () => {
    const req = mockReq();
    authController.startAuth(req, mockRes(), 'reuse');
    expect(req.session.oauthClientKey).toBe('three');
  });

  test('type "reuse" — calls buildUrl with authServerTwo endpoint', () => {
    authController.startAuth(mockReq(), mockRes(), 'reuse');
    expect(buildUrl).toHaveBeenCalledWith(
      authConfig.endpoints.authServerTwo.authorizationEndpoint,
      expect.any(Object)
    );
  });

  test('non-three type — uses "code" response_type', () => {
    authController.startAuth(mockReq(), mockRes(), 'one');
    const params = buildUrl.mock.calls[0][1];
    expect(params.response_type).toBe('code');
  });

  test('calls res.redirect with the built URL', () => {
    const res = mockRes();
    authController.startAuth(mockReq(), res, 'one');
    expect(res.redirect).toHaveBeenCalledWith('https://auth.example.com/authorize?mocked=true');
  });

  test('includes state in buildUrl params', () => {
    authController.startAuth(mockReq(), mockRes(), 'one');
    const params = buildUrl.mock.calls[0][1];
    expect(params.state).toBe('mock_state_value');
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
      session: { oauthState: 'correct_state' },
      query: { code: 'code', state: 'wrong_state' }
    });
    const res = mockRes();
    await authController.callback(req, res);
    expect(res.render).toHaveBeenCalledWith('error', { error: 'State mismatch' });
  });

  test('successful default flow — renders clientindex with access_token', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok123' });
    const req = mockReq({
      session: { oauthState: 'st', authServer: 'serverOne', oauthClientKey: 'one' },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(res.render).toHaveBeenCalledWith('clientindex', { access_token: 'tok123' });
  });

  test('createAccount flow — renders createaccountui', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok' });
    sfService.createAccount.mockResolvedValue({ id: 'acc001', success: true });
    const req = mockReq({
      session: { oauthState: 'st', action: 'createAccount', oauthClientKey: 'one' },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(res.render).toHaveBeenCalledWith('createaccountui', expect.objectContaining({
      result: expect.stringContaining('acc001')
    }));
  });

  test('downloadReport flow — sets attachment and sends report data', async () => {
    const reportData = Buffer.from('fakexlsx');
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok' });
    sfService.downloadReport.mockResolvedValue(reportData);
    const req = mockReq({
      session: { oauthState: 'st', action: 'report', oauthClientKey: 'one' },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(res.attachment).toHaveBeenCalledWith('report.xlsx');
    expect(res.send).toHaveBeenCalledWith(reportData);
  });

  test('calls handleAxiosError when service throws', async () => {
    const err = new Error('token failed');
    sfService.getTokenAuthCode.mockRejectedValue(err);
    const req = mockReq({
      session: { oauthState: 'st', oauthClientKey: 'one' },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Callback');
  });

  test('uses oauthClientKey from session to select client', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok' });
    const req = mockReq({
      session: { oauthState: 'st', oauthClientKey: 'two', authServer: 'serverTwo' },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(sfService.getTokenAuthCode).toHaveBeenCalledWith(
      'code',
      expect.any(String),
      authConfig.clients.two
    );
  });

  test('falls back to client "one" when oauthClientKey missing from session', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok' });
    const req = mockReq({
      session: { oauthState: 'st' },
      query: { code: 'code', state: 'st' }
    });
    const res = mockRes();

    await authController.callback(req, res);

    expect(sfService.getTokenAuthCode).toHaveBeenCalledWith(
      'code',
      expect.any(String),
      authConfig.clients.one
    );
  });

  test('uses serverOne token endpoint when authServer is serverOne', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok' });
    const req = mockReq({
      session: { oauthState: 'st', authServer: 'serverOne', oauthClientKey: 'one' },
      query: { code: 'code', state: 'st' }
    });

    await authController.callback(req, mockRes());

    expect(sfService.getTokenAuthCode).toHaveBeenCalledWith(
      expect.any(String),
      authConfig.endpoints.authServerOne.tokenEndpoint,
      expect.any(Object)
    );
  });

  test('uses serverTwo token endpoint when authServer is not serverOne', async () => {
    sfService.getTokenAuthCode.mockResolvedValue({ access_token: 'tok' });
    const req = mockReq({
      session: { oauthState: 'st', authServer: 'serverTwo', oauthClientKey: 'one' },
      query: { code: 'code', state: 'st' }
    });

    await authController.callback(req, mockRes());

    expect(sfService.getTokenAuthCode).toHaveBeenCalledWith(
      expect.any(String),
      authConfig.endpoints.authServerTwo.tokenEndpoint,
      expect.any(Object)
    );
  });
});
