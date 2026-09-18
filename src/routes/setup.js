const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');

router.get('/setup', setupController.showSetup);
router.post('/setup', setupController.saveSetup);
router.post('/setup/clear', setupController.clearSetup);

module.exports = router;
