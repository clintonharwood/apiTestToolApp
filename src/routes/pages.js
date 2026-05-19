const express = require("express");
const router = express.Router();
const { salesforceDocs } = require("../utils/helpers");
const webToCaseController = require("../controllers/webToCaseController");

const requireWebToCaseEnabled = (req, res, next) => {
  if (process.env.DISABLE_WEB_TO_CASE === 'true') {
    return res.status(403).render('error', { error: 'Web-to-Case is currently disabled.' });
  }
  next();
};

router.get("/", (req, res) => res.render("index"));
router.get("/api", (req, res) => res.render("api"));
router.get("/cmoney", (req, res) => res.render("cmoney"));
router.get("/casedetailsvfpage", (req, res) => res.render("casedetailsvfpage"));
router.get("/webtocase", requireWebToCaseEnabled, (req, res) => webToCaseController.start(req, res));
router.get("/auth", (req, res) => res.render("clientindex", { access_token: "" }));
router.get("/randomsfpage", (req, res) => res.render("sfpagegen"));
router.get("/headlessIdentity", (req, res) => res.render("headlessIdentity"));
router.get("/createPlatformEvent", (req, res) => res.render("platformEvent", { pe_response: "" }));

router.get("/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

module.exports = router;
