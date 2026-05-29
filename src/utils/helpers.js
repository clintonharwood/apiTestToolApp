const crypto = require("crypto");

/** @returns {string} A randomly generated UUID v4. */
const generateUUID = () => crypto.randomUUID();

/**
 * Constructs a URL from a base string, appending the given key-value pairs as query
 * parameters and an optional hash fragment.
 * @param {string} base - The base URL
 * @param {Record<string, string>} options - Query parameters to append
 * @param {string} [hash] - Optional hash fragment
 * @returns {string} The fully constructed URL string
 */
const buildUrl = (base, options, hash) => {
  const u = new URL(base);
  Object.entries(options).forEach(([k, v]) => u.searchParams.set(k, v));
  if (hash) u.hash = hash;
  return u.toString();
};

/**
 * Base64-encodes a client ID and secret in the format required for HTTP Basic
 * authentication headers (percent-encoded values separated by a colon).
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {string} Base64-encoded credentials string
 */
const encodeClientCredentials = (clientId, clientSecret) => {
  return Buffer.from(
    encodeURIComponent(clientId) + ":" + encodeURIComponent(clientSecret)
  ).toString("base64");
};

/**
 * Logs an Axios error and renders the error view with a user-friendly message.
 * Use this as the catch handler for all Salesforce API calls.
 * @param {import('axios').AxiosError} error
 * @param {import('express').Response} res
 * @param {string} [context] - Label shown in the log and error message (e.g. 'SOQL Runner')
 */
const handleAxiosError = (error, res, context = "Request") => {
  console.error(`${context} Failed: status=${error.response?.status} code=${error.response?.data?.[0]?.errorCode ?? error.response?.data?.errorCode ?? 'N/A'}`);
  res.render("error", { error: `${context} failed. Please try again.` });
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

module.exports = { buildUrl, generateUUID, encodeClientCredentials, handleAxiosError, salesforceDocs };
