const mongoose = require('mongoose');

const featureUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  feature: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  hour_window_start: {
    type: Date,
    required: true
  },
  hour_count: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  day_window_start: {
    type: Date,
    required: true
  },
  day_count: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

featureUsageSchema.index({ user_id: 1, feature: 1 }, { unique: true });

module.exports = mongoose.model('FeatureUsage', featureUsageSchema);
