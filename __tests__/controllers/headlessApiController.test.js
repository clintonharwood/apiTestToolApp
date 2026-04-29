jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  handleAxiosError: jest.fn()
}));

const headlessApiController = require('../../src/controllers/headlessApiController');
const sfService = require('../../src/services/salesforceService');
const { handleAxiosError } = require('../../src/utils/helpers');

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.json = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('forgotPassword', () => {
  test('responds with service result on success', async () => {
    sfService.headlessPasswordReset.mockResolvedValue({ status: 'ok' });
    const req = mockReq({ username: 'user@test.com', captchaToken: 'tok123' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  test('passes username and captchaToken to service', async () => {
    sfService.headlessPasswordReset.mockResolvedValue({});
    const req = mockReq({ username: 'u@test.com', captchaToken: 'cap' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(sfService.headlessPasswordReset).toHaveBeenCalledWith('u@test.com', 'cap');
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('network failure');
    sfService.headlessPasswordReset.mockRejectedValue(err);
    const req = mockReq({ username: 'u', captchaToken: 'c' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Headless Reset Password');
  });
});

describe('newPassword', () => {
  test('responds with service result on success', async () => {
    sfService.headlessPasswordSet.mockResolvedValue({ success: true });
    const req = mockReq({ username: 'u', otp: '123', newpassword: 'pass', recaptcha: 'rc' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('passes all four fields to service in correct order', async () => {
    sfService.headlessPasswordSet.mockResolvedValue({});
    const req = mockReq({ username: 'u@test.com', otp: '456', newpassword: 'newp', recaptcha: 'rc2' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(sfService.headlessPasswordSet).toHaveBeenCalledWith('u@test.com', '456', 'newp', 'rc2');
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('bad request');
    sfService.headlessPasswordSet.mockRejectedValue(err);
    const req = mockReq({ username: 'u', otp: '0', newpassword: 'p', recaptcha: 'r' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Headless Set Password');
  });
});
