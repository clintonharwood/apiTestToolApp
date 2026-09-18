jest.mock('../../src/services/salesforceService');
jest.mock('../../src/utils/helpers', () => ({
  handleAxiosError: jest.fn()
}));

const headlessApiController = require('../../src/controllers/headlessApiController');
const sfService = require('../../src/services/salesforceService');
const { handleAxiosError } = require('../../src/utils/helpers');

const SITE_URL = 'https://myorg.my.site.com/portal';

const mockReq = (body = {}, siteUrl = SITE_URL) => ({
  body,
  session: { orgConfig: siteUrl ? { siteUrl } : null },
});
const mockRes = () => {
  const res = {};
  res.json = jest.fn();
  res.status = jest.fn(() => res);
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

  test('passes username, captchaToken, and siteUrl to service', async () => {
    sfService.headlessPasswordReset.mockResolvedValue({});
    const req = mockReq({ username: 'u@test.com', captchaToken: 'cap' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(sfService.headlessPasswordReset).toHaveBeenCalledWith('u@test.com', 'cap', SITE_URL);
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('network failure');
    sfService.headlessPasswordReset.mockRejectedValue(err);
    const req = mockReq({ username: 'u@test.com', captchaToken: 'captcha' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Headless Reset Password');
  });

  test('rejects missing username with 400', async () => {
    const req = mockReq({ captchaToken: 'tok' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid username' });
  });

  test('rejects missing captchaToken with 400', async () => {
    const req = mockReq({ username: 'u@test.com' });
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid captcha token' });
  });

  test('returns 400 when siteUrl is not configured', async () => {
    const req = mockReq({ username: 'u@test.com', captchaToken: 'tok' }, null);
    const res = mockRes();

    await headlessApiController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Site URL') }));
  });
});

describe('newPassword', () => {
  test('responds with service result on success', async () => {
    sfService.headlessPasswordSet.mockResolvedValue({ success: true });
    const req = mockReq({ username: 'user@test.com', otp: '1234', newpassword: 'password1', recaptcha: 'rc' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('passes all fields and siteUrl to service in correct order', async () => {
    sfService.headlessPasswordSet.mockResolvedValue({});
    const req = mockReq({ username: 'u@test.com', otp: '4567', newpassword: 'newpass1', recaptcha: 'rc2' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(sfService.headlessPasswordSet).toHaveBeenCalledWith('u@test.com', '4567', 'newpass1', 'rc2', SITE_URL);
  });

  test('calls handleAxiosError on service failure', async () => {
    const err = new Error('bad request');
    sfService.headlessPasswordSet.mockRejectedValue(err);
    const req = mockReq({ username: 'user@test.com', otp: '0000', newpassword: 'password1', recaptcha: 'r' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(handleAxiosError).toHaveBeenCalledWith(err, res, 'Headless Set Password');
  });

  test('rejects invalid OTP format with 400', async () => {
    const req = mockReq({ username: 'user@test.com', otp: 'abc', newpassword: 'password1', recaptcha: 'r' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid OTP' });
  });

  test('rejects password shorter than 8 chars with 400', async () => {
    const req = mockReq({ username: 'user@test.com', otp: '1234', newpassword: 'short', recaptcha: 'r' });
    const res = mockRes();

    await headlessApiController.newPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid password' });
  });
});
