const { handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

// Callback Handler
exports.forgotPassword = async (req, res) => {
  try {
    const result = await sfService.headlessPasswordReset(req.body.username, req.body.captchaToken);
    return res.json(result);
  } catch (err) {
    handleAxiosError(err, res, "Headless Reset Password");
  }
};

exports.newPassword = async (req, res) => {
  try {
    const result = await sfService.headlessPasswordSet(req.body.username, req.body.otp, req.body.newpassword, req.body.recaptcha);
    console.log(result);
    return res.json(result);
  } catch (err) {
    console.log(err);
    handleAxiosError(err, res, "Headless Reset Password");
  }
};