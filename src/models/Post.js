const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  summary:     { type: String, required: true, trim: true },
  codeSnippet: { type: String, required: false },
  language:    { type: String, default: 'javascript', enum: ['apex', 'javascript', 'soql', 'json'] },
  originalUrl: { type: String, required: true, unique: true, trim: true },
  category:    { type: String, required: true, index: true },
  createdAt:   { type: Date, default: Date.now, index: -1 }
});

module.exports = mongoose.model('Post', PostSchema);
