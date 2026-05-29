const crypto = require('crypto');
const salesforceService = require('../services/salesforceService');
const { buildUrl, handleAxiosError } = require('../utils/helpers');

const INSTANCE_URL_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.(my\.salesforce|salesforce|force)\.com(\/|$)/;
const REDIRECT_URI = 'https://clintox.xyz/callbackbyoca';

/**
 * Renders the connectivity test form page with no prior result or error.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.showPage = (req, res) => {
  res.render('connectivityTest', { result: null, error: null });
};

/**
 * Validates the submitted instance URL, client ID, and client secret, then stores
 * ephemeral OAuth credentials in the session and returns a redirect URL to the
 * Salesforce authorization endpoint as JSON.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.runTest = (req, res) => {
  const { clientId, instanceUrl } = req.body;

  if (!clientId || !instanceUrl) {
    return res.json({ error: 'All fields are required.' });
  }

  if (!INSTANCE_URL_PATTERN.test(instanceUrl)) {
    return res.json({ error: 'Instance URL must be a valid Salesforce domain (e.g. https://myorg.my.salesforce.com).' });
  }

  const normalizedUrl = instanceUrl.replace(/\/$/, '');
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  req.session.byocaTokenEndpoint = `${normalizedUrl}/services/oauth2/token`;
  req.session.byocaInstanceUrl = normalizedUrl;
  req.session.byocaClientId = clientId;

  const redirectUrl = buildUrl(`${normalizedUrl}/services/oauth2/authorize`, {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    state,
  });

  req.session.save((err) => {
    if (err) return res.json({ error: 'Session error. Please try again.' });
    res.json({ redirectUrl });
  });
};

/**
 * Stores BYOCA OAuth credentials in the session and redirects to the given
 * authorization endpoint to begin a bring-your-own-credentials OAuth flow.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} authorizationEndpoint - Full URL of the OAuth authorization endpoint
 * @param {string} tokenEndpoint - Full URL of the OAuth token endpoint
 * @param {string} normalizedUrl - Salesforce instance base URL (trailing slash removed)
 * @param {{client_id: string}} client - OAuth client credentials
 */
exports.startAuthByoca = (req, res, authorizationEndpoint, tokenEndpoint, normalizedUrl, client) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  req.session.byocaTokenEndpoint = tokenEndpoint;
  req.session.byocaInstanceUrl = normalizedUrl;
  req.session.byocaClientId = client.client_id;

  const url = buildUrl(authorizationEndpoint, {
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  res.redirect(url);
};

/**
 * Handles the BYOCA OAuth callback. Validates CSRF state, reads ephemeral credentials
 * from the session, regenerates the session (clearing any prior auth state), then runs
 * the connectivity test and renders the result.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
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
    redirect_uris: [REDIRECT_URI],
  };

  delete req.session.byocaTokenEndpoint;
  delete req.session.byocaInstanceUrl;
  delete req.session.byocaClientId;

  req.session.regenerate(async (err) => {
    if (err) return res.render('error', { error: 'Session error' });
    try {
      const result = await salesforceService.testConnectivity(tokenEndpoint, ephemeralConfig, normalizedUrl, code);
      return res.render('connectivityTest', { result, error: null });
    } catch (innerErr) {
      return handleAxiosError(innerErr, res, 'Connectivity test');
    }
  });
};
