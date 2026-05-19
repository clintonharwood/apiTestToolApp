jest.mock('../../src/controllers/webToCaseController', () => ({
  start: jest.fn(),
}));

const mockReq = () => ({});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

function getGuard() {
  jest.resetModules();
  const router = require('../../src/routes/pages');
  const layer = router.stack.find(
    l => l.route && l.route.path === '/webtocase'
  );
  return layer.route.stack[0].handle;
}

describe('requireWebToCaseEnabled middleware', () => {
  afterEach(() => {
    delete process.env.DISABLE_WEB_TO_CASE;
    jest.clearAllMocks();
  });

  test('calls next() when DISABLE_WEB_TO_CASE is not set', () => {
    const guard = getGuard();
    const next = jest.fn();
    guard(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('calls next() when DISABLE_WEB_TO_CASE is set to a non-true value', () => {
    process.env.DISABLE_WEB_TO_CASE = 'false';
    const guard = getGuard();
    const next = jest.fn();
    guard(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('renders 403 error when DISABLE_WEB_TO_CASE=true', () => {
    process.env.DISABLE_WEB_TO_CASE = 'true';
    const guard = getGuard();
    const next = jest.fn();
    const res = mockRes();
    guard(mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  test('/webtocase route has two handlers (guard + controller)', () => {
    jest.resetModules();
    const router = require('../../src/routes/pages');
    const layer = router.stack.find(
      l => l.route && l.route.path === '/webtocase'
    );
    expect(layer.route.stack.length).toBe(2);
  });
});
