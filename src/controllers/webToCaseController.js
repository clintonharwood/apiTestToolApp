const salesforceService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

exports.showPage = (req, res) => {
  const { orgConfig } = req.session;
  if (!orgConfig?.webToCaseOrgId) {
    return res.render('error', {
      error: 'To use this feature you need to supply your Web-to-Case Org ID via the Org Setup page.'
    });
  }
  res.render('webToCaseForm', { error: null });
};

exports.start = async (req, res) => {
  const { name, email, phone, subject, description } = req.body;
  if (!name || !name.trim()) {
    return res.render('webToCaseForm', { error: 'Name is required.' });
  }

  const { orgConfig } = req.session;
  if (!orgConfig?.webToCaseOrgId) {
    return res.render('error', { error: 'To use this feature you need to supply your Web-to-Case Org ID via the Org Setup page.' });
  }

  const requestBody = { Name: name.trim() };
  if (email)       requestBody.Email        = email.trim();
  if (phone)       requestBody.Phone        = phone.trim();
  if (subject)     requestBody.Subject      = subject.trim();
  if (description) requestBody.Description  = description.trim();

  try {
    const results = await salesforceService.webToCase(requestBody, orgConfig.webToCaseOrgId);
    res.render("webtocaseresult", { result: results });
  } catch (err) {
    handleAxiosError(err, res, 'Web-to-Case');
  }
};
