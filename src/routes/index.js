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

// --- Random Redirect ---
router.get("/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

// --- Auth Routes ---
router.get("/authorizeone", (req, res) => { req.params.type = 'one'; authController.startAuth(req, res); });
router.get("/authorizetwo", (req, res) => { req.params.type = 'two'; authController.startAuth(req, res); });
router.get("/authorizereuse", (req, res) => { req.params.type = 'reuse'; authController.startAuth(req, res); });

// Callbacks
router.get("/callback", authController.callback);
router.get("/callbacknoncommunity", authController.callback);

// Actions requiring Auth
router.get("/createaccount", (req, res) => {
  req.session.action = 'createAccount';
  res.redirect('/authorizetwo');
});

// --- API ---
router.get("/v1/all", apiController.getProducts);
router.get("/v1/500", apiController.serverError);
router.post("/v1/create", apiController.createRecord);
router.get("/v1/timeout", timeout("140s"), (req, res) => {}); // Preserved

module.exports = router;