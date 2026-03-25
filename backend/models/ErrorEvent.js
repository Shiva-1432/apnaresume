const mongoose = require('mongoose');

const errorEventSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['backend', 'frontend'],
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['critical', 'error', 'warning', 'info'],
    default: 'error',
    index: true
  },
  category: {
    type: String,
    default: 'general',
    index: true
  },
  message: {
    type: String,
    required: true
  },
  stack: String,
  path: String,
  method: String,
  status_code: Number,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  session_id: String,
  metadata: {
    type: Object,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('ErrorEvent', errorEventSchema);
