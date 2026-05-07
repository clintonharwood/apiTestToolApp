jest.mock('../../src/services/chaosService');

const chaosController = require('../../src/controllers/chaosController');
const chaosService = require('../../src/services/chaosService');

const mockReq = (sessionOverrides = {}) => ({
  session: { accessToken: 'tok', instanceUrl: 'https://example.my.salesforce.com', ...sessionOverrides },
});

const mockRes = () => {
  const res = { status: jest.fn(), json: jest.fn(), render: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('showChaos', () => {
  test('renders chaos view with hasToken true when session has accessToken', () => {
    const res = mockRes();
    chaosController.showChaos(mockReq(), res);
    expect(res.render).toHaveBeenCalledWith('chaos', { results: null, hasToken: true });
  });

  test('renders chaos view with hasToken false when session has no accessToken', () => {
    const res = mockRes();
    chaosController.showChaos(mockReq({ accessToken: undefined }), res);
    expect(res.render).toHaveBeenCalledWith('chaos', { results: null, hasToken: false });
  });
});

describe('runChaos', () => {
  test('returns 401 when accessToken is missing', async () => {
    const res = mockRes();
    await chaosController.runChaos(mockReq({ accessToken: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test('returns 401 when instanceUrl is missing', async () => {
    const res = mockRes();
    await chaosController.runChaos(mockReq({ instanceUrl: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('calls chaosService.runProbes with token and instanceUrl from session', async () => {
    chaosService.runProbes.mockResolvedValue([]);
    const req = mockReq();
    await chaosController.runChaos(req, mockRes());
    expect(chaosService.runProbes).toHaveBeenCalledWith('tok', 'https://example.my.salesforce.com');
  });

  test('returns probe results as JSON on success', async () => {
    const fakeResults = [{ label: 'test', status: 400, body: {}, ms: 50, passed: false }];
    chaosService.runProbes.mockResolvedValue(fakeResults);
    const res = mockRes();
    await chaosController.runChaos(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ results: fakeResults });
  });

  test('returns 500 with error message when service throws', async () => {
    chaosService.runProbes.mockRejectedValue(new Error('service down'));
    const res = mockRes();
    await chaosController.runChaos(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'service down' });
  });
});
