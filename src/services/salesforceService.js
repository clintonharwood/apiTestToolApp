const axios = require('axios');
const qs = require('qs');
const { encodeClientCredentials } = require('../utils/helpers');

exports.getTokenAuthCode = async (code, endpoint, clientConfig) => {
  const data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: clientConfig.redirectUri,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + encodeClientCredentials(clientConfig.id, clientConfig.secret),
  };

  const response = await axios.post(endpoint, data, { headers });
  return response.data;
};

exports.getTokenClientCreds = async (endpoint, clientConfig) => {
  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientConfig.id,
    client_secret: clientConfig.secret,
  });

  const response = await axios.post(endpoint, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return response.data;
};

exports.publishPlatformEvent = async (accessToken, eventData) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v63.0/sobjects/Clintox_Test_Event__e/";
  const response = await axios.post(url, eventData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    }
  });
  return response.data;
};

exports.createAccount = async (accessToken, accountData) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v60.0/sobjects/Account";
  const response = await axios.post(url, accountData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    }
  });
  return response.data;
};