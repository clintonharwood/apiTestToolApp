const axios = require('axios');
const crypto = require('crypto');
const { handleAxiosError } = require("../utils/helpers");

const ALLOWED_SF_HOSTNAMES = /^[a-zA-Z0-9-]+\.(my\.salesforce\.com|my\.site\.com|force\.com|salesforce-sites\.com)$/;

/**
 * Generates an OAuth CSRF state token, stores it in the session, and redirects to the
 * Salesforce authorization endpoint to begin the Lightning Out OAuth flow.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.renderLwc = (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');
    req.session.lightningOutState = state;

    const authUrl = `https://clintoxsupport.my.salesforce.com/services/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${process.env.SF_CLIENT_ID_LO}&` +
        `redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&` +
        `state=${encodeURIComponent(state)}`;
    res.redirect(authUrl);
};

/**
 * Handles the Lightning Out OAuth callback: validates CSRF state, exchanges the
 * authorization code for a token, fetches a frontdoor URL, validates its hostname,
 * regenerates the session, and renders the Lightning Out component page.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.callback = async (req, res) => {
    const { code, state } = req.query;

    if (!state || !req.session.lightningOutState || state !== req.session.lightningOutState) {
        return res.status(400).render("error", { error: "State mismatch" });
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.SF_CLIENT_ID_LO);
    params.append('client_secret', process.env.SF_CLIENT_SECRET_LO);
    params.append('redirect_uri', process.env.REDIRECT_URI);

    try {
        const tokenRes = await axios.post(`https://clintoxsupport.my.salesforce.com/services/oauth2/token`, params, { timeout: 15000 });
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
            res.render('lightningout', {
                frontdoorUrl: finalFrontdoorUrl,
                instanceUrl: 'https://clintoxsupport.my.salesforce.com',
                appId: '1UsOd00000000w5KAA',
                user: {
                    name: "Salesforce Trailblazer"
                }
            });
        });
    } catch (err) {
        handleAxiosError(err, res, "Lightning Out callback");
    }
};
