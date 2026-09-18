jest.mock('../../src/controllers/authController', () => ({
  startAuth: jest.fn(),
  callback: jest.fn(),
  startClientCredentialsFlow: jest.fn(),
  serveReportPage: jest.fn(),
  serveReportDownload: jest.fn(),
}));
jest.mock('../../src/controllers/lightningOutController', () => ({
  renderLwc: jest.fn(),
  callback: jest.fn(),
}));

const mockNext = jest.fn();

const mockReq = () => ({});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

// Extract requireClientCredsEnabled by pulling it out of /authorizeclientcreds route
function getGuard() {
  jest.resetModules();
  const router = require('../../src/routes/auth');
  const layer = router.stack.find(
    l => l.route && l.route.path === '/authorizeclientcreds'
  );
  return layer.route.stack[0].handle;
}

describe('requireClientCredsEnabled middleware', () => {
  afterEach(() => {
    delete process.env.DISABLE_CLIENT_CREDENTIALS;
    jest.clearAllMocks();
  });

  test('calls next() when DISABLE_CLIENT_CREDENTIALS is not set', () => {
    const guard = getGuard();
    const next = jest.fn();
    guard(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('calls next() when DISABLE_CLIENT_CREDENTIALS is set to a non-true value', () => {
    process.env.DISABLE_CLIENT_CREDENTIALS = 'false';
    const guard = getGuard();
    const next = jest.fn();
    guard(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('renders 403 error when DISABLE_CLIENT_CREDENTIALS=true', () => {
    process.env.DISABLE_CLIENT_CREDENTIALS = 'true';
    const guard = getGuard();
    const next = jest.fn();
    const res = mockRes();
    guard(mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  test('/authorizeclientcreds route has guard + controller (2 handlers)', () => {
    jest.resetModules();
    const router = require('../../src/routes/auth');
    const layer = router.stack.find(
      l => l.route && l.route.path === '/authorizeclientcreds'
    );
    expect(layer.route.stack.length).toBe(2);
  });

  test('other routes do not have the guard (/authorize has one handler)', () => {
    jest.resetModules();
    const router = require('../../src/routes/auth');
    const layer = router.stack.find(
      l => l.route && l.route.path === '/authorize'
    );
    expect(layer.route.stack.length).toBe(1);
  });
});
