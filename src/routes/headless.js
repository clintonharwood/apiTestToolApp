const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const headlessApiController = require("../controllers/headlessApiController");
const { ensureAuthenticated } = require("../middleware/ensureAuthenticated");

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/forgot-password", ensureAuthenticated, resetLimiter, headlessApiController.forgotPassword);
router.post("/new-password", ensureAuthenticated, resetLimiter, headlessApiController.newPassword);

module.exports = router;
