const crypto = require("crypto");
const authConfig = require("../config/authConfig");
const { buildUrl, handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

const VALID_TYPES = ['one', 'two', 'three', 'reuse', 'authServer'];

/**
 * Initiates the OAuth authorization code flow for the specified client type.
 * Stores CSRF state and client key in the session, then redirects to the
 * appropriate authorization endpoint.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'one'|'two'|'three'|'reuse'|'authServer'} type - Selects the OAuth client and auth server to use
 */
exports.startAuth = (req, res, type) => {
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).render('error', { error: 'Invalid auth type' });
  }

  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;

  let endpoint = authConfig.endpoints.authServerOne.authorizationEndpoint;
  let client = authConfig.clients.one;

  if (type === 'two') {
    endpoint = authConfig.endpoints.authServerTwo.authorizationEndpoint;
    req.session.authServer = 'serverTwo';
  } else if (type === 'three') {
    endpoint = authConfig.endpoints.authServerThree.authorizationEndpoint;
    client = authConfig.clients.three;
  } else if (type === 'reuse') {
    endpoint = authConfig.endpoints.authServerTwo.authorizationEndpoint;
    client = authConfig.clients.three;
  } else if (type === 'authServer') {
    endpoint = authConfig.endpoints.salesforceAuthServer.authorizationEndpoint
    client = authConfig.clients.one;
    req.session.authServer = 'authServer';
  } else {
    req.session.authServer = 'serverOne';
  }

  req.session.oauthClientKey = Object.keys(authConfig.clients).find(
    k => authConfig.clients[k] === client
  );

  const url = buildUrl(endpoint, {
    response_type: type === 'three' ? "client_credentials" : "code",
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0],
    state: state,
  });

  res.redirect(url);
};

/**
 * Handles the OAuth authorization code callback. Validates the CSRF state,
 * exchanges the code for tokens, regenerates the session, and either performs an
 * action (createAccount, report, platformEvent) or renders the main client page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.render("error", { error: "Authorization error" });
  if (!state || !req.session.oauthState || state !== req.session.oauthState) {
    return res.render("error", { error: "State mismatch" });
  }

  try {
    const isServerOne = req.session.authServer === 'serverOne';
    const endpoint = isServerOne ? authConfig.endpoints.authServerOne.tokenEndpoint : req.session.authServer === 'authServer' ? authConfig.endpoints.salesforceAuthServer.tokenEndpoint : authConfig.endpoints.authServerTwo.tokenEndpoint;

    const clientKey = req.session.oauthClientKey || 'one';
    const client = authConfig.clients[clientKey];
    const action = req.session.action;

    const tokenData = await sfService.getTokenAuthCode(code, endpoint, client);

    const passportSession = req.session.passport;
    // Regenerate session after login to prevent session fixation
    req.session.regenerate(async (err) => {
      if (err) return res.render("error", { error: "Session error" });
      if (passportSession) req.session.passport = passportSession;
      req.session.accessToken = tokenData.access_token;
      req.session.instanceUrl = tokenData.instance_url;

      try {
        if (action === 'createAccount') {
          return res.redirect('/createaccount');
        } else if (action === 'report') {
          return res.redirect('/serveReport');
        } else if (action === 'platformEvent') {
          const platformEvent = await sfService.publishPlatformEvent(tokenData.access_token);
          return res.render("platformEvent", { pe_response: JSON.stringify(platformEvent) });
        }
        res.render("clientindex", { access_token: tokenData.access_token });
      } catch (innerErr) {
        handleAxiosError(innerErr, res, "Callback");
      }
    });
  } catch (err) {
    handleAxiosError(err, res, "Callback");
  }
};

/**
 * Renders the report download page. Requires an active session token; returns
 * an error view if no token is present.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.serveReportPage = (req, res) => {
  if (!req.session.accessToken) {
    return res.render('error', { error: 'No active session. Please re-authenticate.' });
  }
  res.render('reportDownload');
};

/**
 * Streams a Salesforce report as an Excel file download. Requires an active session
 * token; returns 401 JSON if no token is present.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.serveReportDownload = async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'No active session' });
  }
  try {
    const report = await sfService.downloadReport(req.session.accessToken);
    res.attachment('report.xlsx');
    res.send(report);
  } catch (err) {
    handleAxiosError(err, res, 'Report Download');
  }
};

/**
 * Initiates the OAuth client credentials flow, acquires a token directly (no user
 * redirect), regenerates the session, and renders the main client page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.startClientCredentialsFlow = async (req, res) => {
  try {
    const endpoint = authConfig.endpoints.salesforceAuthServer.tokenEndpoint;
    const client = authConfig.clients['three'];

    const tokenData = await sfService.getTokenClientCreds(endpoint, client);

    const passportSession = req.session.passport;
    // Regenerate session after login to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return res.render("error", { error: "Session error" });
      if (passportSession) req.session.passport = passportSession;
      req.session.accessToken = tokenData.access_token;
      req.session.instanceUrl = tokenData.instance_url;
      res.render("clientindex", { access_token: tokenData.access_token });
    });
  } catch (err) {
    handleAxiosError(err, res, "Client Credentials");
  }
};