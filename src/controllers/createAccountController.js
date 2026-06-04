const sfService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

exports.submit = async (req, res) => {
  const { name, type, industry, employees, phone, website } = req.body;
  if (!name || !name.trim()) {
    return res.render('createAccountForm', { error: 'Account Name is required.' });
  }
  const accountData = { Name: name.trim() };
  if (type)      accountData.Type              = type;
  if (industry)  accountData.Industry          = industry;
  if (employees) accountData.NumberOfEmployees = parseInt(employees, 10);
  if (phone)     accountData.Phone             = phone.trim();
  if (website)   accountData.Website           = website.trim();

  try {
    const result = await sfService.createAccount(req.session.accessToken, accountData);
    return res.render('createaccountui', { result: JSON.stringify(result) });
  } catch (err) {
    handleAxiosError(err, res, 'Create Account');
  }
};
