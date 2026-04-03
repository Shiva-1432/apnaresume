const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  target_id: mongoose.Schema.Types.ObjectId,
  target_type: String,
  changes: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  ip_address: String,
  user_agent: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AdminLog', adminLogSchema);
