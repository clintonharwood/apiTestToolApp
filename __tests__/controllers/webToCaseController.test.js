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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('webToCaseController.start', () => {
  test('renders webtocaseresult with service response on success', async () => {
    salesforceService.webToCase.mockResolvedValue('<html>ok</html>');
    const res = mockRes();
    await webToCaseController.start({}, res);
    expect(res.render).toHaveBeenCalledWith('webtocaseresult', { result: '<html>ok</html>' });
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('network error');
    salesforceService.webToCase.mockRejectedValue(err);
    const res = mockRes();
    await webToCaseController.start({}, res);
    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Web-to-Case');
  });
});
