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
    try {
        // 1. Get Access Token (In a POC, you might use a Username/Password flow for simplicity, 
        // though Web Server flow is better for production).
        const tokenResponse = await axios.post(`https://login.salesforce.com/services/oauth2/token`, null, {
            params: {
                grant_type: 'password',
                client_id: process.env.SF_CLIENT_ID_LO,
                client_secret: process.env.SF_CLIENT_SECRET_LO,
                username: process.env.SF_USERNAME,
                password: process.env.SF_PASSWORD
            }
        });

        const { access_token, instance_url } = tokenResponse.data;

        // 2. Exchange Access Token for Frontdoor URL
        // This is the new endpoint introduced for LO 2.0
        const frontdoorResponse = await axios.get(`https://clintoxsupport.my.salesforce.com/services/oauth2/singleaccess`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        // 3. Render the page with the Frontdoor URL and App ID
        res.render('lightningout', { 
            frontdoorUrl: frontdoorResponse.data.url, 
            appId: '1UsOd00000000w5KAA',
            instanceUrl: instance_url
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// --- Headless API ---
router.post('/forgot-password', (req, res) => { headlessApiController.forgotPassword(req, res) });
router.post('/new-password', (req, res) => { headlessApiController.newPassword(req, res) });

module.exports = router;