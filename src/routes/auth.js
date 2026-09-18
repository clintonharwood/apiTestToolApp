const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const lightningOutController = require("../controllers/lightningOutController");
const { ensureAuthenticated } = require("../middleware/ensureAuthenticated");

const requireClientCredsEnabled = (req, res, next) => {
  if (process.env.DISABLE_CLIENT_CREDENTIALS === 'true') {
    return res.status(403).render('error', { error: 'Client credentials flow is currently disabled.' });
  }
  next();
};

// Authorization Code flow — standard instance URL
router.get("/authorize", (req, res) => authController.startAuth(req, res, 'standard'));

// Authorization Code flow — Experience Cloud site URL
router.get("/authorizesite", (req, res) => authController.startAuth(req, res, 'site'));

// Client Credentials flow
router.get("/authorizeclientcreds", requireClientCredsEnabled, (req, res) => authController.startClientCredentialsFlow(req, res));

// OAuth callbacks
router.get("/callback", authController.callback);
router.get("/callbacklightningout", ensureAuthenticated, lightningOutController.callback);

// Action-triggered auth flows (auth then redirect to feature)
router.get("/downloadReport", (req, res) => {
  req.session.action = 'report';
  authController.startAuth(req, res, 'standard');
});
router.get("/serveReport", authController.serveReportPage);
router.get("/serveReport/download", authController.serveReportDownload);

router.get("/publishPlatformEvent", (req, res) => {
  req.session.action = 'platformEvent';
  authController.startAuth(req, res, 'standard');
});

// Lightning Out
router.get("/render-lwc", ensureAuthenticated, lightningOutController.renderLwc);

module.exports = router;
