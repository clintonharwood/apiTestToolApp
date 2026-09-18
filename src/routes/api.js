const express = require("express");
const router = express.Router();
const timeout = require("connect-timeout");
const apiController = require("../controllers/apiController");

router.get("/v1/all", apiController.getProducts);
router.get("/v1/500", apiController.serverError);
router.post("/v1/create", apiController.createRecord);
router.get("/v1/timeout", timeout("140s"), (req, res) => {}); // Preserved

module.exports = router;
