jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers');

const salesforceService = require('../../src/services/salesforceService');
const { handleAxiosError } = require('../../src/utils/helpers');
const webToCaseController = require('../../src/controllers/webToCaseController');

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (body = {}, orgConfig = { webToCaseOrgId: '00D000000000000AAA' }) => ({
  body,
  session: { orgConfig },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('webToCaseController.showPage', () => {
  test('renders error view with advisory message when webToCaseOrgId is missing', () => {
    const res = mockRes();
    webToCaseController.showPage(mockReq({}, null), res);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ error: expect.stringContaining('Org Setup') }));
  });

  test('renders error view when orgConfig exists but webToCaseOrgId is absent', () => {
    const res = mockRes();
    webToCaseController.showPage(mockReq({}, {}), res);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ error: expect.stringContaining('Org Setup') }));
  });

  test('renders webToCaseForm when webToCaseOrgId is present', () => {
    const res = mockRes();
    webToCaseController.showPage(mockReq({}), res);
    expect(res.render).toHaveBeenCalledWith('webToCaseForm', { error: null });
  });
});

describe('webToCaseController.start', () => {
  test('renders error when name is missing', async () => {
    const res = mockRes();
    await webToCaseController.start(mockReq({ email: 'a@b.com' }), res);
    expect(res.render).toHaveBeenCalledWith('webToCaseForm', { error: 'Name is required.' });
  });

  test('renders error when webToCaseOrgId is not configured', async () => {
    const res = mockRes();
    await webToCaseController.start(mockReq({ name: 'Test' }, null), res);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ error: expect.stringContaining('Org Setup') }));
  });

  test('renders webtocaseresult with service response on success', async () => {
    salesforceService.webToCase.mockResolvedValue('<html>ok</html>');
    const res = mockRes();
    await webToCaseController.start(mockReq({ name: 'Test User' }), res);
    expect(res.render).toHaveBeenCalledWith('webtocaseresult', { result: '<html>ok</html>' });
  });

  test('calls salesforceService.webToCase with orgId from session', async () => {
    salesforceService.webToCase.mockResolvedValue('<html>ok</html>');
    const res = mockRes();
    await webToCaseController.start(mockReq({ name: 'Test User' }), res);
    expect(salesforceService.webToCase).toHaveBeenCalledWith(
      expect.any(Object),
      '00D000000000000AAA'
    );
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('network error');
    salesforceService.webToCase.mockRejectedValue(err);
    const res = mockRes();
    await webToCaseController.start(mockReq({ name: 'Test' }), res);
    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Web-to-Case');
  });
});
