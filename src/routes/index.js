const express = require("express");
const router = express.Router();
const timeout = require("connect-timeout");

const authController = require("../controllers/authController");
const apiController = require("../controllers/apiController");
const { salesforceDocs } = require("../utils/helpers");

// --- Pages ---
router.get("/", (req, res) => res.render("index"));
router.get("/api", (req, res) => res.render("api"));
router.get("/cmoney", (req, res) => res.render("cmoney"));
router.get("/casedetailsvfpage", (req, res) => res.render("casedetailsvfpage"));
router.get("/webtocase", (req, res) => res.render("webtocaseresult", { result: "Success" }));
router.get("/auth", (req, res) => res.render("clientindex", { access_token: "" }));
router.get("/randomsfpage", (req, res) => res.render("sfpagegen"));

// --- Random Redirect ---
router.get("/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

// --- Auth Routes ---
router.get("/authorizeone", (req, res) => { req.params.type = 'one'; authController.startAuth(req, res); });
router.get("/authorizetwo", (req, res) => { req.params.type = 'two'; authController.startAuth(req, res); });
router.get("/authorizereuse", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });
// TODO impl
router.get("/authorizeCodeCredsFlow", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });
router.get("/revokeOAuthToken", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });
router.get("/revokeThree", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });

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
  req.params.type = 'two';
  res.redirect(authController.startAuth(req, res));
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

module.exports = router;