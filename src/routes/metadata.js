const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadataController');

router.get('/metadata', (req, res) => metadataController.showPage(req, res));
router.get('/api/metadata/objects', (req, res) => metadataController.getObjects(req, res));
router.get('/api/metadata/object/:name/fields', (req, res) => metadataController.getFields(req, res));

module.exports = router;
