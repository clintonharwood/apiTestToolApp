const express = require("express");
const router = express.Router();
const timeout = require("connect-timeout");
const apiController = require("../controllers/apiController");
const lightningOutController = require("../controllers/lightningOutController");

router.get("/v1/all", apiController.getProducts);
router.get("/v1/500", apiController.serverError);
router.post("/v1/create", apiController.createRecord);
router.get("/v1/timeout", timeout("140s"), (req, res) => {}); // Preserved
router.get("/render-lwc", lightningOutController.renderLwc);
router.get("/lightningoutcallback", lightningOutController.callback);

module.exports = router;
