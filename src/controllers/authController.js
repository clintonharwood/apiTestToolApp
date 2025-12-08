const randomstring = require("randomstring");
const authConfig = require("../config/authConfig");
const { buildUrl, handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

// Start Auth Flow
exports.startAuth = (req, res) => {
  const type = req.params.type; // 'one', 'two', 'three', 'reuse'
  const state = randomstring.generate();
  req.session.oauthState = state; // Safe storage
  
  let endpoint = authConfig.endpoints.authServerOne.authorizationEndpoint;
  let client = authConfig.clients.one;

  if (type === 'two') {
    endpoint = authConfig.endpoints.authServerTwo.authorizationEndpoint;
    req.session.authServer = 'serverTwo';
  } else if (type === 'three') {
    endpoint = authConfig.endpoints.authServerThree.authorizationEndpoint;
    client = authConfig.clients.four;
  } else if (type === 'reuse') {
    endpoint = authConfig.endpoints.authServerTwo.authorizationEndpoint;
    client = authConfig.clients.three;
  } else {
    req.session.authServer = 'serverOne';
  }

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
  if (error) return res.render("error", { error });
  if (state !== req.session.oauthState) return res.render("error", { error: "State mismatch" });

  try {
    const isServerOne = req.session.authServer === 'serverOne';
    const endpoint = isServerOne ? authConfig.endpoints.authServerOne.tokenEndpoint : authConfig.endpoints.authServerTwo.tokenEndpoint;
    
    // Determine client based on URL (simplification for this example)
    // You might need distinct callback routes if clients differ significantly
    const client = req.path.includes('noncommunity') ? authConfig.clients.two : authConfig.clients.one;

    const tokenData = await sfService.getTokenAuthCode(code, endpoint, client);
    req.session.accessToken = tokenData.access_token;
    
    // Handle post-login actions (Create Account / Download Report)
    if (req.session.action === 'createAccount') {
       const acc = await sfService.createAccount(tokenData.access_token, { Name: "Clintox API Test Tool" });
       return res.render("createaccountui", { result: JSON.stringify(acc) });
    } else if (req.session.action === 'report') {
       const report = await sfService.downloadReport(tokenData.access_token);
       res.attachment("report.xlsx");
       return res.send(report);
    }
    
    res.render("clientindex", { access_token: tokenData.access_token });
  } catch (err) {
    handleAxiosError(err, res, "Callback");
  }
};