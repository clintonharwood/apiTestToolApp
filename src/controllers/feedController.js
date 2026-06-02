const mongoose = require('mongoose');
const Post = require('../models/Post');

exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find().sort({ _id: -1 }).limit(10).lean();
    const nextCursor = posts.length ? posts[posts.length - 1]._id.toString() : null;
    res.render('feed', { posts, nextCursor });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load feed' });
  }
};

exports.getPosts = (req, res) => {
  const { cursor } = req.query;
  const query = cursor ? { _id: { $lt: new mongoose.Types.ObjectId(cursor) } } : {};
  Post.find(query).sort({ _id: -1 }).limit(10).lean()
    .then(posts => {
      const nextCursor = posts.length ? posts[posts.length - 1]._id.toString() : null;
      res.render('partials/card', { posts }, (err, html) => {
        if (err) return res.status(500).json({ error: 'Render failed' });
        res.json({ html, nextCursor });
      });
    })
    .catch(() => res.status(500).json({ error: 'Failed to fetch posts' }));
};
