const salesforceService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

/**
 * Submits a Web-to-Case request to Salesforce and renders the result page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.start = async (req, res) => {
  try {
    const results = await salesforceService.webToCase();
    res.render("webtocaseresult", { result: results });
  } catch (err) {
    handleAxiosError(err, res, 'Web-to-Case');
  }
};
