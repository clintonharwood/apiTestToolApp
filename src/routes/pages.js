const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { salesforceDocs } = require("../utils/helpers");
const webToCaseController = require("../controllers/webToCaseController");
const soqlController = require("../controllers/soqlController");

/**
 * Middleware that blocks the Web-to-Case route when the DISABLE_WEB_TO_CASE
 * env var is set to 'true'.
 * @type {import('express').RequestHandler}
 */
const requireWebToCaseEnabled = (req, res, next) => {
  if (process.env.DISABLE_WEB_TO_CASE === 'true') {
    return res.status(403).render('error', { error: 'Web-to-Case is currently disabled.' });
  }
  next();
};

/**
 * Middleware that guards routes requiring an active OAuth session. Redirects
 * unauthenticated requests to /auth.
 * @type {import('express').RequestHandler}
 */
const hasToken = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.redirect('/auth');
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

router.get("/", (req, res) => res.render("index"));
router.get("/api", (req, res) => res.render("api"));
router.get("/cmoney", (req, res) => res.render("cmoney"));
router.get("/casedetailsvfpage", (req, res) => res.render("casedetailsvfpage"));
router.get("/webtocase", requireWebToCaseEnabled, (req, res) => webToCaseController.start(req, res));
router.get("/auth", (req, res) => res.render("clientindex", { access_token: "" }));
router.get("/randomsfpage", (req, res) => res.render("sfpagegen"));
router.get("/headlessIdentity", (req, res) => res.render("headlessIdentity"));
router.get("/createPlatformEvent", (req, res) => res.render("platformEvent", { pe_response: "" }));
router.get("/soql", hasToken, (req, res) => res.render("soqlRunner", { query: '', results: null, totalSize: null, error: null, showRaw: false, rawJson: null }));
router.post("/soql", hasToken, soqlLimiter, (req, res) => soqlController.start(req, res));

router.get("/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

module.exports = router;
