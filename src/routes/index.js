const express = require("express");
const router = express.Router();
const timeout = require("connect-timeout");
const axios = require('axios');

const authController = require("../controllers/authController");
const apiController = require("../controllers/apiController");
const headlessApiController = require("../controllers/headlessApiController");
const { salesforceDocs } = require("../utils/helpers");
const authConfig = require("../config/authConfig");

// --- Pages ---
router.get("/", (req, res) => res.render("index"));
router.get("/api", (req, res) => res.render("api"));
router.get("/cmoney", (req, res) => res.render("cmoney"));
router.get("/casedetailsvfpage", (req, res) => res.render("casedetailsvfpage"));
router.get("/webtocase", (req, res) => res.render("webtocaseresult", { result: "Success" }));
router.get("/auth", (req, res) => res.render("clientindex", { access_token: "" }));
router.get("/randomsfpage", (req, res) => res.render("sfpagegen"));
router.get("/headlessIdentity", (req, res) => res.render("headlessIdentity"));

// --- Random Redirect ---
router.get("/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

// --- Auth Routes ---
router.get("/authorizeone", (req, res) => { req.params.type = 'one'; authController.startAuth(req, res); });
router.get("/authorizetwo", (req, res) => { req.params.type = 'two'; authController.startAuth(req, res); });
router.get("/authorizethree", (req, res) => { req.params.type = 'three'; authController.startAuth(req, res); });
router.get("/authorizereuse", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });
// TODO impl
router.get("/authorizeCodeCredsFlow", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });
router.get("/revokeOAuthToken", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });

// Callbacks
router.get("/callback", authController.callback);
router.get("/callbacknoncommunity", authController.callback);
// TODO impl
router.get("/callbackcodeexchange", authController.callback);
router.get("/callbackreuse", authController.callback);
router.get("/callbackclientcredsflow", authController.callback);

// Actions requiring Auth
router.get("/createaccount", (req, res) => {
  req.session.action = 'createAccount';
  res.redirect('/authorizetwo');
});
router.get("/downloadReport", (req, res) => {
  req.session.action = 'report';
  res.redirect('/authorizetwo');
});
router.get("/createPlatformEvent", (req, res) => {
  res.render("platformEvent", { pe_response: "" });
});
//TODO impl
router.get("/publishPlatfromEvent", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });

// --- API ---
router.get("/v1/all", apiController.getProducts);
router.get("/v1/500", apiController.serverError);
router.post("/v1/create", apiController.createRecord);
router.get("/v1/timeout", timeout("140s"), (req, res) => {}); // Preserved
router.get("/render-lwc", async (req, res) => {
    const authUrl = `https://clintoxsupport.my.salesforce.com/services/oauth2/authorize?` + 
        `response_type=code&` +
        `client_id=${process.env.SF_CLIENT_ID_LO}&` +
        `redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// 2. Callback: Exchange Code for Token
router.get('/lightningoutcallback', async (req, res) => {
    const { code } = req.query;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.SF_CLIENT_ID_LO);
    params.append('client_secret', process.env.SF_CLIENT_SECRET_LO);
    params.append('redirect_uri', process.env.REDIRECT_URI);

    try {
        // Exchange code for Access Token
        const tokenRes = await axios.post(`https://clintoxsupport.my.salesforce.com/services/oauth2/token`, params);
        const { access_token, instance_url } = tokenRes.data;

        // NOW you can call SingleAccess because this token has User Context
        const fdRes = await axios.get(`https://clintoxsupport.my.salesforce.com/services/oauth2/singleaccess`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        // Render your EJS page with the Frontdoor URL
        res.render('lightningout', { 
            frontdoorUrl: fdRes.data.url, 
            instanceUrl: 'https://clintoxsupport.my.salesforce.com',
            appId: '1UsOd00000000w5KAA'
        });
    } catch (err) {
        res.status(500).send('Authentication failed: ' + err.message);
    }
});

// --- Headless API ---
router.post('/forgot-password', (req, res) => { headlessApiController.forgotPassword(req, res) });
router.post('/new-password', (req, res) => { headlessApiController.newPassword(req, res) });

module.exports = router;