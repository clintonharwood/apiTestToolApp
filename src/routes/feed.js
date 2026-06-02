const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

router.get('/feed', feedController.getFeed);
router.get('/api/posts', feedController.getPosts);

module.exports = router;
