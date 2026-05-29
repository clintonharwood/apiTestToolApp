const { handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

const isString = (v) => typeof v === 'string';

/**
 * Validates the username and captcha token, then initiates a headless password reset
 * on the Experience Cloud portal.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.forgotPassword = async (req, res) => {
  const { username, captchaToken } = req.body;
  if (!isString(username) || username.length === 0 || username.length > 200) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  if (!isString(captchaToken) || captchaToken.length === 0) {
    return res.status(400).json({ error: 'Invalid captcha token' });
  }
  try {
    const result = await sfService.headlessPasswordReset(username, captchaToken);
    return res.json(result);
  } catch (err) {
    handleAxiosError(err, res, "Headless Reset Password");
  }
};

/**
 * Validates username, OTP, new password strength, and recaptcha, then sets the new
 * password on the Experience Cloud portal via the headless identity API.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.newPassword = async (req, res) => {
  const { username, otp, newpassword, recaptcha } = req.body;
  if (!isString(username) || username.length === 0 || username.length > 200) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  if (!isString(otp) || !/^\d{4,8}$/.test(otp)) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  if (!isString(newpassword) || newpassword.length < 8 || newpassword.length > 128) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  if (!isString(recaptcha) || recaptcha.length === 0) {
    return res.status(400).json({ error: 'Invalid recaptcha token' });
  }
  try {
    const result = await sfService.headlessPasswordSet(username, otp, newpassword, recaptcha);
    return res.json(result);
  } catch (err) {
    handleAxiosError(err, res, "Headless Set Password");
  }
};
