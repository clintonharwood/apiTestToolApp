const randomstring = require("randomstring");
const authConfig = require("../config/authConfig");
const { buildUrl, handleAxiosError } = require("../utils/helpers");
const sfService = require("../services/salesforceService");

// Start Auth Flow
exports.startAuth = (req, res) => {
  const type = req.params.type; // 'one', 'two', 'reuse'
  const state = randomstring.generate();
  req.session.oauthState = state; // Safe storage
  
  let endpoint = authConfig.endpoints.serverOne.auth;
  let client = authConfig.clients.one;

  if (type === 'two') {
    endpoint = authConfig.endpoints.serverTwo.auth;
    req.session.authServer = 'serverTwo';
  } else if (type === 'reuse') {
    endpoint = authConfig.endpoints.serverTwo.auth;
    client = authConfig.clients.four;
  } else {
    req.session.authServer = 'serverOne';
  }

  const url = buildUrl(endpoint, {
    response_type: "code",
    client_id: client.id,
    redirect_uri: client.redirectUri,
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
    const endpoint = isServerOne ? authConfig.endpoints.serverOne.token : authConfig.endpoints.serverTwo.token;
    
    // Determine client based on URL (simplification for this example)
    // You might need distinct callback routes if clients differ significantly
    const client = req.path.includes('noncommunity') ? authConfig.clients.two : authConfig.clients.one;

    const tokenData = await sfService.getTokenAuthCode(code, endpoint, client);
    req.session.accessToken = tokenData.access_token;
    
    // Handle post-login actions (Create Account / Download Report)
    if (req.session.action === 'createAccount') {
       const acc = await sfService.createAccount(tokenData.access_token, { Name: "Clintox API Test Tool" });
       return res.render("createaccountui", { result: JSON.stringify(acc) });
    }
    
    res.render("clientindex", { access_token: tokenData.access_token });
  } catch (err) {
    handleAxiosError(err, res, "Callback");
  }
};