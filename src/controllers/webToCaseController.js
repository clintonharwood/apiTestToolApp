const salesforceService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

exports.start = async (req, res) => {
  try {
    const results = await salesforceService.webToCase();
    res.render("webtocaseresult", { result: results });
  } catch (err) {
    handleAxiosError(err, res, 'Web-to-Case');
  }
};
