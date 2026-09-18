const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { salesforceDocs } = require("../utils/helpers");
const webToCaseController = require("../controllers/webToCaseController");
const soqlController = require("../controllers/soqlController");
const createAccountController = require("../controllers/createAccountController");
const chaosController = require('../controllers/chaosController');
const { ensureAuthenticated } = require("../middleware/ensureAuthenticated");

const requireWebToCaseEnabled = (req, res, next) => {
  if (process.env.DISABLE_WEB_TO_CASE === 'true') {
    return res.status(403).render('error', { error: 'Web-to-Case is currently disabled.' });
  }
  next();
};

/**
 * Middleware that guards routes requiring an active OAuth token. Redirects to /auth.
 */
const hasToken = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.redirect('/auth');
  }
  next();
};

/**
 * Middleware that guards all feature routes requiring an org config in session.
 * Redirects to /setup if not present.
 */
const hasOrgConfig = (req, res, next) => {
  if (!req.session.orgConfig) {
    return res.redirect('/setup');
  }
  next();
};

const soqlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many queries, please try again later.',
});

router.get("/", (req, res) => res.render("index", {
  webToCaseEnabled: process.env.DISABLE_WEB_TO_CASE !== 'true',
  orgConfig: req.session.orgConfig || null,
}));
router.get("/api", (req, res) => res.render("api"));
router.get("/video", (req, res) => res.render("video"));
router.get("/cmoney", (req, res) => res.render("cmoney"));
router.get("/casedetailsvfpage", ensureAuthenticated, (req, res) => res.render("casedetailsvfpage"));

router.get("/webtocase", requireWebToCaseEnabled, hasOrgConfig, webToCaseController.showPage);
router.post("/webtocase", requireWebToCaseEnabled, hasOrgConfig, (req, res) => webToCaseController.start(req, res));

router.get("/auth", hasOrgConfig, (req, res) => res.render("clientindex", {
  access_token: req.session.accessToken || "",
  orgConfig: req.session.orgConfig,
  clientCredsEnabled: process.env.DISABLE_CLIENT_CREDENTIALS !== 'true',
}));

router.get("/randomsfpage", ensureAuthenticated, (req, res) => res.render("sfpagegen"));

router.get("/headlessIdentity", ensureAuthenticated, hasOrgConfig, (req, res) => res.render("headlessIdentity"));

router.get("/createPlatformEvent", hasOrgConfig, (req, res) => res.render("platformEvent", { pe_response: "" }));

router.get("/createaccount", hasOrgConfig, hasToken, (req, res) => res.render("createAccountForm", { error: null }));
router.post("/createaccount", hasOrgConfig, hasToken, createAccountController.submit);

router.get("/soql", hasOrgConfig, hasToken, (req, res) => res.render("soqlRunner", { query: '', results: null, totalSize: null, error: null, showRaw: false, rawJson: null }));
router.post("/soql", hasOrgConfig, hasToken, soqlLimiter, (req, res) => soqlController.start(req, res));

router.get('/chaos', hasOrgConfig, hasToken, chaosController.showChaos);
router.post('/chaos/run', hasOrgConfig, hasToken, chaosController.runChaos);

router.get("/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

module.exports = router;
