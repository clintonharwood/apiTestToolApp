const express = require("express");
const router = express.Router();

router.use("/", require("./feed"));
router.use("/", require("./pages"));
router.use("/", require("./auth"));
router.use("/", require("./api"));
router.use("/", require("./headless"));
router.use("/", require("./chaos"));
router.use("/", require("./connectivityTest"));

module.exports = router;
