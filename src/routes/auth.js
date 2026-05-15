const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/authorizeone", (req, res) => authController.startAuth(req, res, 'one'));
router.get("/authorizetwo", (req, res) => authController.startAuth(req, res, 'two'));
const requireClientCredsEnabled = (req, res, next) => {
  if (process.env.DISABLE_CLIENT_CREDENTIALS === 'true') {
    return res.status(403).render('error', { error: 'Client credentials flow is currently disabled.' });
  }
  next();
};

router.get("/authorizethree", requireClientCredsEnabled, (req, res) => authController.startAuth(req, res, 'three'));
router.get("/authorizereuse", (req, res) => authController.startAuth(req, res, 'reuse'));
// TODO impl
router.get("/authorizeCodeCredsFlow", (req, res) => authController.startAuth(req, res, 'reuse'));
router.get("/revokeOAuthToken", (req, res) => authController.startAuth(req, res, 'reuse'));

router.get("/callback", authController.callback);
router.get("/callbacknoncommunity", authController.callback);
// TODO impl
router.get("/callbackcodeexchange", authController.callback);
router.get("/callbackreuse", authController.callback);
router.get("/callbackclientcredsflow", requireClientCredsEnabled, authController.callbackClientCreds);

router.get("/createaccount", (req, res) => {
  req.session.action = 'createAccount';
  res.redirect('/authorizetwo');
});
router.get("/downloadReport", (req, res) => {
  req.session.action = 'report';
  res.redirect('/authorizetwo');
});
// TODO impl
router.get("/publishPlatfromEvent", (req, res) => authController.startAuth(req, res, 'reuse'));

module.exports = router;
