const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  enabled: {
    type: Boolean,
    default: false
  },
  rollout_percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  environments: {
    dev: { type: Boolean, default: true },
    staging: { type: Boolean, default: true },
    prod: { type: Boolean, default: true }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

featureFlagSchema.pre('save', function preSave(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
