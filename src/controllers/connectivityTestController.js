const crypto = require('crypto');
const salesforceService = require('../services/salesforceService');
const { buildUrl, handleAxiosError } = require('../utils/helpers');

const INSTANCE_URL_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.(my\.salesforce|salesforce|force)\.com(\/|$)/;
const REDIRECT_URI = 'https://clintox.xyz/auth/callbackbyoca';

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
  const authorizationEndpoint = `${normalizedUrl}/services/oauth2/authorize`;

  exports.startAuthByoca(req, res, authorizationEndpoint, tokenEndpoint, normalizedUrl, { client_id: clientId, client_secret: clientSecret });
};

exports.startAuthByoca = (req, res, authorizationEndpoint, tokenEndpoint, normalizedUrl, client) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  req.session.byocaTokenEndpoint = tokenEndpoint;
  req.session.byocaInstanceUrl = normalizedUrl;
  req.session.byocaClientId = client.client_id;
  req.session.byocaClientSecret = client.client_secret;

  const url = buildUrl(authorizationEndpoint, {
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  res.redirect(url);
};

exports.callbackByoca = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.render('error', { error: 'Authorization error' });
  if (!state || !req.session.oauthState || state !== req.session.oauthState) {
    return res.render('error', { error: 'State mismatch' });
  }

  const tokenEndpoint = req.session.byocaTokenEndpoint;
  const normalizedUrl = req.session.byocaInstanceUrl;
  const ephemeralConfig = {
    client_id: req.session.byocaClientId,
    client_secret: req.session.byocaClientSecret,
    redirect_uris: [REDIRECT_URI],
  };

  delete req.session.byocaTokenEndpoint;
  delete req.session.byocaInstanceUrl;
  delete req.session.byocaClientId;
  delete req.session.byocaClientSecret;

  try {
    const result = await salesforceService.testConnectivity(tokenEndpoint, ephemeralConfig, normalizedUrl, code);
    return res.render('connectivityTest', { result, error: null });
  } catch (err) {
    return handleAxiosError(err, res, 'Connectivity test');
  }
};
