
const url = require("url");
const __ = require("underscore");

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const buildUrl = (base, options, hash) => {
  var newUrl = url.parse(base, true);
  delete newUrl.search;
  if (!newUrl.query) {
    newUrl.query = {};
  }
  __.each(options, function (value, key, list) {
    newUrl.query[key] = value;
  });
  if (hash) {
    newUrl.hash = hash;
  }

  return url.format(newUrl);
};

const encodeClientCredentials = (clientId, clientSecret) => {
  return Buffer.from(
    encodeURIComponent(clientId) + ":" + encodeURIComponent(clientSecret)
  ).toString("base64");
};

// Centralized error handling for Axios
const handleAxiosError = (error, res, context = "Request") => {
  console.error(`${context} Failed:`, error.message);
  const msg = error.response ? JSON.stringify(error.response.data) : error.message;
  res.render("error", { error: `${context} failed: ${msg}` });
};

const salesforceDocs = [
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_anonymous_block.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_curl.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_AuthConfiguration.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_quickstart_retrieve_add_components.htm",
  "https://developer.salesforce.com/docs/component-library/bundle/lightning-accordion/example",
  "https://developer.salesforce.com/docs/component-library/bundle/aura:component/documentation",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_debugging_system_log_console.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_limits.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_OAuthRefreshResult.htm#apex_Auth_OAuthRefreshResult_constructors",
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/file_based.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_switch.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_primitives.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_json_jsongenerator.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_encoding.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/quickstart_using_other_tools.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/headers_duplicaterules.htm",
  "https://developer.salesforce.com/docs/component-library/bundle/ui:button/example",
  "https://developer.salesforce.com/docs/component-library/bundle/lightning-file-upload/documentation",
  "https://developer.salesforce.com/docs/component-library/bundle/lightning-layout-item/example",
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_rest_deploy.htm",
  "https://developer.salesforce.com/docs/einstein/genai/guide/agent-api.html",
];

module.exports = {buildUrl, generateUUID, encodeClientCredentials, handleAxiosError, salesforceDocs}