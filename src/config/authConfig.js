const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';

/**
 * Builds OAuth endpoint URLs from a Salesforce instance URL and optional site URL.
 * @param {string} instanceUrl - e.g. https://myorg.my.salesforce.com
 * @param {string} [siteUrl]   - e.g. https://myorg.my.site.com/portal
 * @returns {{ authorize, token, siteAuthorize, siteToken }}
 */
function buildEndpoints(instanceUrl, siteUrl) {
  return {
    authorize:     `${instanceUrl}/services/oauth2/authorize`,
    token:         `${instanceUrl}/services/oauth2/token`,
    siteAuthorize: siteUrl ? `${siteUrl}/services/oauth2/authorize` : null,
    siteToken:     siteUrl ? `${siteUrl}/services/oauth2/token` : null,
  };
}

module.exports = { buildEndpoints, BASE_URL };
