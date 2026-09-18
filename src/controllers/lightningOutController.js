const axios = require('axios');
const crypto = require('crypto');
const { handleAxiosError } = require("../utils/helpers");
const { BASE_URL } = require("../config/authConfig");

const ALLOWED_SF_HOSTNAMES = /^[a-zA-Z0-9-]+\.(my\.salesforce\.com|my\.site\.com|force\.com|salesforce-sites\.com)$/;
const REDIRECT_URI = `${BASE_URL}/callbacklightningout`;

/**
 * Generates an OAuth CSRF state token, stores it in the session, and redirects to the
 * Salesforce authorization endpoint to begin the Lightning Out OAuth flow.
 */
exports.renderLwc = (req, res) => {
  const { orgConfig } = req.session;
  if (!orgConfig) return res.redirect('/setup');
  if (!orgConfig.lightningAppId) {
    return res.render('error', { error: 'Lightning App ID not configured. Go to /setup and set Lightning App ID.' });
  }

  const state = crypto.randomBytes(32).toString('hex');
  req.session.lightningOutState = state;

  const authUrl = `${orgConfig.instanceUrl}/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent(orgConfig.clientId)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${encodeURIComponent(state)}`;

  res.redirect(authUrl);
};

/**
 * Handles the Lightning Out OAuth callback: validates CSRF state, exchanges the
 * authorization code for a token, fetches a frontdoor URL, validates its hostname,
 * regenerates the session, and renders the Lightning Out component page.
 */
exports.callback = async (req, res) => {
  const { code, state } = req.query;

  if (!state || !req.session.lightningOutState || state !== req.session.lightningOutState) {
    return res.status(400).render("error", { error: "State mismatch" });
  }

  const { orgConfig } = req.session;
  if (!orgConfig) return res.redirect('/setup');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('client_id', orgConfig.clientId);
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const tokenRes = await axios.post(`${orgConfig.instanceUrl}/services/oauth2/token`, params, { timeout: 15000 });
    const { access_token, instance_url } = tokenRes.data;

    const fdRes = await axios.get(`${instance_url}/services/oauth2/singleaccess`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
      timeout: 15000
    });

    let finalFrontdoorUrl = fdRes.data.frontdoor_uri;
    if (!finalFrontdoorUrl.startsWith('https://')) {
      finalFrontdoorUrl = `https://${finalFrontdoorUrl}`;
    }
    try {
      const parsedUrl = new URL(finalFrontdoorUrl);
      if (!ALLOWED_SF_HOSTNAMES.test(parsedUrl.hostname)) {
        return res.status(400).render('error', { error: 'Invalid frontdoor URL' });
      }
    } catch {
      return res.status(400).render('error', { error: 'Invalid frontdoor URL' });
    }

    req.session.regenerate((err) => {
      if (err) return res.render("error", { error: "Session error" });
      req.session.orgConfig = orgConfig;
      res.render('lightningout', {
        frontdoorUrl: finalFrontdoorUrl,
        instanceUrl: instance_url,
        appId: orgConfig.lightningAppId,
      });
    });
  } catch (err) {
    handleAxiosError(err, res, "Lightning Out callback");
  }
};
