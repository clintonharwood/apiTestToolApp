jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  handleAxiosError: jest.fn()
}));

const connectivityTestController = require('../../src/controllers/connectivityTestController');
const sfService = require('../../src/services/salesforceService');
const { handleAxiosError } = require('../../src/utils/helpers');

const mockReq = (body = {}) => ({ body });
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

  test('calls testConnectivity with normalized URL and ephemeral config', async () => {
    sfService.testConnectivity.mockResolvedValue({ tokenAcquired: true, recordCount: 5, instanceUrl: 'https://myorg.my.salesforce.com' });
    const res = mockRes();
    await connectivityTestController.runTest(
      mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com/' }),
      res
    );
    expect(sfService.testConnectivity).toHaveBeenCalledWith(
      'https://myorg.my.salesforce.com/services/oauth2/token',
      { client_id: 'cid', client_secret: 'csec' },
      'https://myorg.my.salesforce.com'
    );
  });

  test('renders result on success', async () => {
    const result = { tokenAcquired: true, recordCount: 3, instanceUrl: 'https://myorg.my.salesforce.com' };
    sfService.testConnectivity.mockResolvedValue(result);
    const res = mockRes();
    await connectivityTestController.runTest(
      mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com' }),
      res
    );
    expect(res.render).toHaveBeenCalledWith('connectivityTest', { result, error: null });
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('network error');
    sfService.testConnectivity.mockRejectedValue(err);
    const res = mockRes();
    await connectivityTestController.runTest(
      mockReq({ clientId: 'cid', clientSecret: 'csec', instanceUrl: 'https://myorg.my.salesforce.com' }),
      res
    );
    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Connectivity test');
  });
});
