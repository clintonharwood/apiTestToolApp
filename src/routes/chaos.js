const express = require('express');
const router = express.Router();
const chaosController = require('../controllers/chaosController');

router.get('/chaos', chaosController.showChaos);
router.post('/chaos/run', chaosController.runChaos);

module.exports = router;
