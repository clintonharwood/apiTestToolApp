const axios = require('axios');
const qs = require('qs');

const TIMEOUT = 15000;

/**
 * Exchanges an OAuth authorization code for an access token using the authorization
 * code grant type.
 * @param {string} code - The authorization code from the OAuth callback
 * @param {string} endpoint - Token endpoint URL
 * @param {{client_id: string, redirect_uris: string[]}} clientConfig
 * @returns {Promise<{access_token: string, instance_url: string}>}
 */
exports.getTokenAuthCode = async (code, endpoint, clientConfig) => {
  const data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    client_id: clientConfig.client_id,
    redirect_uri: clientConfig.redirect_uris[0]
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const response = await axios.post(endpoint, data, { headers, timeout: TIMEOUT });
  return response.data;
};

/**
 * Acquires an access token using the OAuth client credentials grant (no user redirect).
 * @param {string} endpoint - Token endpoint URL
 * @param {{client_id: string, client_secret: string}} clientConfig
 * @returns {Promise<{access_token: string, instance_url: string}>}
 */
exports.getTokenClientCreds = async (endpoint, clientConfig) => {
  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientConfig.client_id,
    client_secret: clientConfig.client_secret,
  });

  const response = await axios.post(endpoint, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: TIMEOUT
  });
  return response.data;
};

/**
 * Publishes a test Clintox_Test_Event__e platform event to the connected Salesforce org.
 * @param {string} accessToken - Salesforce Bearer token
 * @returns {Promise<object>} Salesforce API response
 */
exports.publishPlatformEvent = async (accessToken) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v63.0/sobjects/Clintox_Test_Event__e/";
  const data = { Order_id__c: "123456" };
  const response = await axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    timeout: TIMEOUT
  });
  return response.data;
};

/**
 * Creates an Account sObject record in the connected Salesforce org.
 * @param {string} accessToken - Salesforce Bearer token
 * @param {{Name: string}} accountData - Fields for the new Account record
 * @returns {Promise<{id: string, success: boolean}>}
 */
exports.createAccount = async (accessToken, accountData) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v60.0/sobjects/Account";
  const response = await axios.post(url, accountData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    timeout: TIMEOUT
  });
  return response.data;
};

/**
 * Downloads a specific Salesforce Analytics report as an Excel binary.
 * @param {string} accessToken - Salesforce Bearer token
 * @returns {Promise<Buffer>} Raw Excel file data
 */
exports.downloadReport = async (accessToken) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v60.0/analytics/reports/00O5K000000XecLUAS";
  const response = await axios.get(url, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      Authorization: "Bearer " + accessToken,
    },
    timeout: TIMEOUT
  });
  return response.data;
};

/**
 * Initiates a headless forgot-password flow on the Experience Cloud portal.
 * @param {string} username - The user's email/username
 * @param {string} captchaToken - reCAPTCHA response token
 * @returns {Promise<object>} Salesforce headless identity API response
 */
exports.headlessPasswordReset = async (username, captchaToken) => {
  const requestBody = {
    username: username,
    recaptcha: captchaToken
  }
  const response = await axios.post(
      `https://clintoxsupport.my.site.com/complaintsnew/services/auth/headless/forgot_password`,
      requestBody,
      {
          headers: {
              'Content-Type': 'application/json'
          },
          timeout: TIMEOUT
      }
  );
  return response.data;
};

/**
 * Sets a new password on the Experience Cloud portal after OTP verification.
 * @param {string} username - The user's email/username
 * @param {string} otp - One-time passcode sent to the user
 * @param {string} password - The new password to set
 * @param {string} recaptcha - reCAPTCHA response token
 * @returns {Promise<object>} Salesforce headless identity API response
 */
exports.headlessPasswordSet = async (username, otp, password, recaptcha) => {
  const requestBody = {
    username: username,
    otp: otp,
    newpassword: password,
    recaptcha: recaptcha
  }
  const response = await axios.post(
      `https://clintoxsupport.my.site.com/complaintsnew/services/auth/headless/forgot_password`,
      requestBody,
      {
          headers: {
              'Content-Type': 'application/json'
          },
          timeout: TIMEOUT
      }
  );
  return response.data;
};

/**
 * Submits a hardcoded support case to the Salesforce Web-to-Case endpoint.
 * @returns {Promise<string>} Raw HTML response from Salesforce
 */
exports.webToCase = async (requestBody) => {

  const response = await axios.post(
    `https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=00D5j00000CvOSL`,
    qs.stringify(requestBody),
    {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: TIMEOUT
    }
  );

  //requestModule.get('https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=00D5j00000CvOSL&orgid=00D5j00000CvOSL&retURL=http%3A%2F%2F&name=Donald&email=clinto_is%40hotamil.com&phone=0323202928&subject=Test&description=Test&submit=Submit&debug=1&debugEmail=clinto_is%40hotmail.com');
  
  return response.data;
}

/**
 * Executes a SOQL query against a Salesforce instance and returns the query result.
 * @param {string} accessToken - Salesforce Bearer token
 * @param {string} instanceUrl - Salesforce instance base URL
 * @param {string} query - The SOQL query string
 * @returns {Promise<{totalSize: number, records: object[]}>}
 */
exports.runSoqlQuery = async (accessToken, instanceUrl, query) => {
  const response = await axios.get(
      `${instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: TIMEOUT
      }
  );
  return response.data;
}

/**
 * Tests end-to-end Salesforce connectivity by exchanging an auth code for a token and
 * running a minimal SOQL query. Returns a summary result without persisting the token.
 * @param {string} tokenEndpoint - OAuth token endpoint URL
 * @param {{client_id: string, redirect_uris: string[]}} clientConfig
 * @param {string} instanceUrl - Salesforce instance base URL
 * @param {string} code - OAuth authorization code
 * @returns {Promise<{tokenAcquired: boolean, recordCount: number, instanceUrl: string}>}
 */
exports.testConnectivity = async (tokenEndpoint, clientConfig, instanceUrl, code) => {
  const tokenData = await exports.getTokenAuthCode(code, tokenEndpoint, clientConfig);
  const queryData = await exports.runSoqlQuery(
    tokenData.access_token,
    instanceUrl,
    'SELECT Id FROM User LIMIT 1'
  );
  return {
    tokenAcquired: true,
    recordCount: queryData.totalSize,
    instanceUrl,
  };
};
