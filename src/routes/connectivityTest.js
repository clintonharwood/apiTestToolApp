const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const connectivityTestController = require('../controllers/connectivityTestController');

const connectivityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/connectivity-test', connectivityTestController.showPage);
router.post('/connectivity-test/run', connectivityLimiter, connectivityTestController.runTest);

module.exports = router;
