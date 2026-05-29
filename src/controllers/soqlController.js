const salesforceService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

/**
 * Executes the submitted SOQL query against the user's connected Salesforce org using
 * the session token, and renders the results with optional raw JSON display.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.start = async (req, res) => {
  try {
    const query = req.body.query.trim();
    if (!query) {
      return res.render("soqlRunner", { query: '', results: null, totalSize: null, error: "Query cannot be empty", showRaw: false, rawJson: null });
    }
    const data = await salesforceService.runSoqlQuery(req.session.accessToken, req.session.instanceUrl, query);
    res.render("soqlRunner", {
      query,
      results: data.records,
      totalSize: data.totalSize,
      error: null,
      showRaw: req.body.showRaw === 'on',
      rawJson: JSON.stringify(data, null, 2),
    });
  } catch (err) {
    handleAxiosError(err, res, 'SOQL Runner');
  }
};
