const axios = require('axios');
const qs = require('qs');

const TIMEOUT = 15000;

/**
 * Exchanges an OAuth authorization code for an access token.
 * @param {string} code
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

  const response = await axios.post(endpoint, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: TIMEOUT
  });
  return response.data;
};

/**
 * Acquires an access token using the OAuth client credentials grant.
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
 * Publishes a platform event to the connected Salesforce org.
 * @param {string} accessToken
 * @param {string} instanceUrl - e.g. https://myorg.my.salesforce.com
 * @param {string} platformEventName - API name, e.g. My_Event__e
 * @returns {Promise<object>}
 */
exports.publishPlatformEvent = async (accessToken, instanceUrl, platformEventName) => {
  const url = `${instanceUrl}/services/data/v63.0/sobjects/${platformEventName}/`;
  const response = await axios.post(url, { Order_id__c: "123456" }, {
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
 * @param {string} accessToken
 * @param {string} instanceUrl
 * @param {{Name: string}} accountData
 * @returns {Promise<{id: string, success: boolean}>}
 */
exports.createAccount = async (accessToken, instanceUrl, accountData) => {
  const url = `${instanceUrl}/services/data/v60.0/sobjects/Account`;
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
 * Downloads a Salesforce Analytics report as an Excel binary.
 * @param {string} accessToken
 * @param {string} instanceUrl
 * @param {string} reportId - Salesforce report record ID
 * @returns {Promise<Buffer>}
 */
exports.downloadReport = async (accessToken, instanceUrl, reportId) => {
  const url = `${instanceUrl}/services/data/v60.0/analytics/reports/${reportId}`;
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
 * Initiates a headless forgot-password flow on an Experience Cloud portal.
 * @param {string} username
 * @param {string} captchaToken
 * @param {string} siteUrl - Experience Cloud site base URL, e.g. https://myorg.my.site.com/portal
 * @returns {Promise<object>}
 */
exports.headlessPasswordReset = async (username, captchaToken, siteUrl) => {
  const response = await axios.post(
    `${siteUrl}/services/auth/headless/forgot_password`,
    { username, recaptcha: captchaToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: TIMEOUT }
  );
  return response.data;
};

/**
 * Sets a new password on an Experience Cloud portal after OTP verification.
 * @param {string} username
 * @param {string} otp
 * @param {string} password
 * @param {string} recaptcha
 * @param {string} siteUrl - Experience Cloud site base URL
 * @returns {Promise<object>}
 */
exports.headlessPasswordSet = async (username, otp, password, recaptcha, siteUrl) => {
  const response = await axios.post(
    `${siteUrl}/services/auth/headless/forgot_password`,
    { username, otp, newpassword: password, recaptcha },
    { headers: { 'Content-Type': 'application/json' }, timeout: TIMEOUT }
  );
  return response.data;
};

/**
 * Submits a support case to the Salesforce Web-to-Case endpoint.
 * @param {object} requestBody - Form fields (Name, Email, etc.)
 * @param {string} webToCaseOrgId - 18-char Salesforce Org ID
 * @returns {Promise<string>} Raw HTML response from Salesforce
 */
exports.webToCase = async (requestBody, webToCaseOrgId) => {
  const response = await axios.post(
    `https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=${webToCaseOrgId}`,
    qs.stringify(requestBody),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: TIMEOUT
    }
  );
  return response.data;
};

/**
 * Executes a SOQL query against a Salesforce instance.
 * @param {string} accessToken
 * @param {string} instanceUrl
 * @param {string} query
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
};
