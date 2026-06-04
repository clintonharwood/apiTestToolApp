const salesforceService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

/**
 * Submits a Web-to-Case request to Salesforce and renders the result page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.start = async (req, res) => {
  const { name, email, phone, subject, description } = req.body;
  if (!name || !name.trim()) {
    return res.render('webToCaseForm', { error: 'Name is required.' });
  }
  const requestBody = { Name: name.trim() };
  if (email)      requestBody.Email            = email.trim();
  if (phone)     requestBody.Phone             = phone.trim();
  if (subject)   requestBody.Subject           = subject.trim();
  if (description)  requestBody.Description    = description.trim();
  requestBody.orgid = '00D5j00000CvOSL';

  try {
    const results = await salesforceService.webToCase(requestBody);
    res.render("webtocaseresult", { result: results });
  } catch (err) {
    handleAxiosError(err, res, 'Web-to-Case');
  }
};
