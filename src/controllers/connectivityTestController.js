const salesforceService = require('../services/salesforceService');
const { handleAxiosError } = require('../utils/helpers');

const INSTANCE_URL_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.(my\.salesforce|salesforce|force)\.com(\/|$)/;

exports.showPage = (req, res) => {
  res.render('connectivityTest', { result: null, error: null });
};

exports.runTest = async (req, res) => {
  const { clientId, clientSecret, instanceUrl } = req.body;

  if (!clientId || !clientSecret || !instanceUrl) {
    return res.render('connectivityTest', { result: null, error: 'All fields are required.' });
  }

  if (!INSTANCE_URL_PATTERN.test(instanceUrl)) {
    return res.render('connectivityTest', { result: null, error: 'Instance URL must be a valid Salesforce domain (e.g. https://myorg.my.salesforce.com).' });
  }

  const normalizedUrl = instanceUrl.replace(/\/$/, '');
  const tokenEndpoint = `${normalizedUrl}/services/oauth2/token`;
  const ephemeralConfig = { client_id: clientId, client_secret: clientSecret };

  try {
    const result = await salesforceService.testConnectivity(tokenEndpoint, ephemeralConfig, normalizedUrl);
    return res.render('connectivityTest', { result, error: null });
  } catch (err) {
    return handleAxiosError(err, res, 'Connectivity test');
  }
};
