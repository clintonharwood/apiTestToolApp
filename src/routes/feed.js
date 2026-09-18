const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { ensureAuthenticated } = require('../middleware/ensureAuthenticated');

router.get('/feed', ensureAuthenticated, feedController.getFeed);
router.get('/api/posts', ensureAuthenticated, feedController.getPosts);

module.exports = router;
