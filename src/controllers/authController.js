const crypto = require("crypto");
const authConfig = require("../config/authConfig");
const { buildUrl, handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

const VALID_TYPES = ['one', 'two', 'three', 'reuse', 'authServer'];

// Start Auth Flow
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
    client = authConfig.clients.two;
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

// Callback Handler
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

    // Regenerate session after login to prevent session fixation
    req.session.regenerate(async (err) => {
      if (err) return res.render("error", { error: "Session error" });
      req.session.accessToken = tokenData.access_token;
      req.session.instanceUrl = tokenData.instance_url;

      try {
        if (action === 'createAccount') {
          const acc = await sfService.createAccount(tokenData.access_token, { Name: "Clintox API Test Tool" });
          return res.render("createaccountui", { result: JSON.stringify(acc) });
        } else if (action === 'report') {
          const report = await sfService.downloadReport(tokenData.access_token);
          res.attachment("report.xlsx");
          return res.send(report);
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

exports.startClientCredentialsFlow = async (req, res) => {
  try {
    const endpoint = authConfig.endpoints.salesforceAuthServer.tokenEndpoint;
    const client = authConfig.clients['three'];

    const tokenData = await sfService.getTokenClientCreds(endpoint, client);

    // Regenerate session after login to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return res.render("error", { error: "Session error" });
      req.session.accessToken = tokenData.access_token;
      req.session.instanceUrl = tokenData.instance_url;
      res.render("clientindex", { access_token: tokenData.access_token });
    });
  } catch (err) {
    // TODO Remove
    console.log(err);
    handleAxiosError(err, res, "Client Credentials");
  }
};