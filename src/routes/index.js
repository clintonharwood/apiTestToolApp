const express = require("express");
const router = express.Router();

router.use("/", require("./pages"));
router.use("/", require("./auth"));
router.use("/", require("./api"));
router.use("/", require("./headless"));

module.exports = router;
