const crypto = require("crypto");
const { buildEndpoints, BASE_URL } = require("../config/authConfig");
const { buildUrl, handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

const REDIRECT_URI = `${BASE_URL}/callback`;

/**
 * Initiates the OAuth authorization code flow using the session org config.
 * Stores CSRF state in the session and redirects to the authorization endpoint.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'standard'|'site'|'clientcreds'} type
 */
exports.startAuth = (req, res, type) => {
  const { orgConfig } = req.session;
  if (!orgConfig) return res.redirect('/setup');

  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  req.session.authType = type;

  const endpoints = buildEndpoints(orgConfig.instanceUrl, orgConfig.siteUrl);

  const authEndpoint = (type === 'site' && endpoints.siteAuthorize)
    ? endpoints.siteAuthorize
    : endpoints.authorize;

  const url = buildUrl(authEndpoint, {
    response_type: 'code',
    client_id: orgConfig.clientId,
    redirect_uri: REDIRECT_URI,
    state,
  });

  res.redirect(url);
};

/**
 * Handles the OAuth authorization code callback. Validates CSRF state, exchanges
 * the code for tokens, regenerates the session, and renders the client page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.render("error", { error: "Authorization error" });
  if (!state || !req.session.oauthState || state !== req.session.oauthState) {
    return res.render("error", { error: "State mismatch" });
  }

  const { orgConfig, authType, action } = req.session;
  if (!orgConfig) return res.redirect('/setup');

  try {
    const endpoints = buildEndpoints(orgConfig.instanceUrl, orgConfig.siteUrl);
    const tokenEndpoint = (authType === 'site' && endpoints.siteToken)
      ? endpoints.siteToken
      : endpoints.token;

    const clientConfig = {
      client_id: orgConfig.clientId,
      redirect_uris: [REDIRECT_URI],
    };

    const tokenData = await sfService.getTokenAuthCode(code, tokenEndpoint, clientConfig);

    const passportSession = req.session.passport;
    req.session.regenerate(async (err) => {
      if (err) return res.render("error", { error: "Session error" });
      if (passportSession) req.session.passport = passportSession;
      req.session.orgConfig = orgConfig;
      req.session.accessToken = tokenData.access_token;
      req.session.instanceUrl = tokenData.instance_url;

      try {
        if (action === 'createAccount') {
          return res.redirect('/createaccount');
        } else if (action === 'report') {
          return res.redirect('/serveReport');
        } else if (action === 'platformEvent') {
          if (!orgConfig.platformEventName) {
            return res.render('error', { error: 'Platform Event name not configured. Go to /setup and set Platform Event API Name.' });
          }
          const platformEvent = await sfService.publishPlatformEvent(
            tokenData.access_token,
            tokenData.instance_url,
            orgConfig.platformEventName
          );
          return res.render("platformEvent", { pe_response: JSON.stringify(platformEvent) });
        }
        res.render("clientindex", {
          access_token: tokenData.access_token,
          orgConfig,
        });
      } catch (innerErr) {
        handleAxiosError(innerErr, res, "Callback");
      }
    });
  } catch (err) {
    handleAxiosError(err, res, "Callback");
  }
};

/**
 * Renders the report download page.
 */
exports.serveReportPage = (req, res) => {
  if (!req.session.accessToken) {
    return res.render('error', { error: 'No active session. Please re-authenticate.' });
  }
  res.render('reportDownload');
};

/**
 * Streams a Salesforce report as an Excel file download.
 */
exports.serveReportDownload = async (req, res) => {
  const { orgConfig, accessToken } = req.session;
  if (!accessToken) return res.status(401).json({ error: 'No active session' });
  if (!orgConfig?.reportId) {
    return res.status(400).json({ error: 'Report ID not configured. Go to /setup and set Report ID.' });
  }
  try {
    const report = await sfService.downloadReport(accessToken, orgConfig.instanceUrl, orgConfig.reportId);
    res.attachment('report.xlsx');
    res.send(report);
  } catch (err) {
    handleAxiosError(err, res, 'Report Download');
  }
};

/**
 * Initiates the OAuth client credentials flow, acquires a token directly (no user redirect).
 */
exports.startClientCredentialsFlow = async (req, res) => {
  const { orgConfig } = req.session;
  if (!orgConfig) return res.redirect('/setup');

  try {
    const endpoints = buildEndpoints(orgConfig.instanceUrl, orgConfig.siteUrl);
    const clientConfig = {
      client_id: orgConfig.clientId,
    };

    const tokenData = await sfService.getTokenClientCreds(endpoints.token, clientConfig);

    const passportSession = req.session.passport;
    req.session.regenerate((err) => {
      if (err) return res.render("error", { error: "Session error" });
      if (passportSession) req.session.passport = passportSession;
      req.session.orgConfig = orgConfig;
      req.session.accessToken = tokenData.access_token;
      req.session.instanceUrl = tokenData.instance_url;
      res.render("clientindex", { access_token: tokenData.access_token, orgConfig });
    });
  } catch (err) {
    handleAxiosError(err, res, "Client Credentials");
  }
};
