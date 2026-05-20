const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const requireClientCredsEnabled = (req, res, next) => {
  if (process.env.DISABLE_CLIENT_CREDENTIALS === 'true') {
    return res.status(403).render('error', { error: 'Client credentials flow is currently disabled.' });
  }
  next();
};

router.get("/authorizeone", (req, res) => authController.startAuth(req, res, 'one'));
router.get("/authorizetwo", (req, res) => authController.startAuth(req, res, 'two'));
router.get("/authorizethree", requireClientCredsEnabled, (req, res) => authController.startClientCredentialsFlow(req, res));
router.get("/authorizereuse", (req, res) => authController.startAuth(req, res, 'reuse'));
router.get("/webserverflow", (req, res) => authController.startAuth(req, res, 'authServer'));
// TODO impl
router.get("/authorizecodecredsflow", (req, res) => authController.startAuth(req, res, 'reuse'));
router.get("/revokeoauthtoken", (req, res) => authController.startAuth(req, res, 'reuse'));

router.get("/callback", authController.callback);
router.get("/callbacknoncommunity", authController.callback);
// TODO impl
router.get("/callbackcodeexchange", authController.callback);
router.get("/callbackreuse", authController.callback);

router.get("/createaccount", (req, res) => {
  req.session.action = 'createAccount';
  authController.startAuth(req, res, 'authServer');
});
router.get("/downloadReport", (req, res) => {
  req.session.action = 'report';
  authController.startAuth(req, res, 'authServer');
});
router.get("/serveReport", authController.serveReportPage);
router.get("/serveReport/download", authController.serveReportDownload);
// TODO impl
router.get("/publishPlatfromEvent", (req, res) => {
  req.session.action = 'platformEvent';
  authController.startAuth(req, res, 'authServer');
});

module.exports = router;
