jest.mock('../../src/controllers/authController', () => ({
  startAuth: jest.fn(),
  callback: jest.fn(),
  startClientCredentialsFlow: jest.fn(),
}));

const mockNext = jest.fn();

const mockReq = () => ({});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

// Extract requireClientCredsEnabled by pulling it out of the router's layer stack
function getGuard() {
  jest.resetModules();
  const router = require('../../src/routes/auth');
  // The guard is applied to /authorizethree — find the layer for that path
  const layer = router.stack.find(
    l => l.route && l.route.path === '/authorizethree'
  );
  // The first handler in the stack is the guard, the second is the controller wrapper
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

  test('/callbackclientcredsflow route does not exist (client credentials has no redirect callback)', () => {
    jest.resetModules();
    const router = require('../../src/routes/auth');
    const layer = router.stack.find(
      l => l.route && l.route.path === '/callbackclientcredsflow'
    );
    expect(layer).toBeUndefined();
  });

  test('other routes do not have the guard (authorizeone has one handler)', () => {
    jest.resetModules();
    const router = require('../../src/routes/auth');
    const layer = router.stack.find(
      l => l.route && l.route.path === '/authorizeone'
    );
    expect(layer.route.stack.length).toBe(1);
  });
});
