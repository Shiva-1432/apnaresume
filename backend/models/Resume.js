const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  file_name: String,
  version_name: String,
  extracted_text: {
    type: String,
    required: true
  },

  parent_resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },

  target_role: String,

  is_version: {
    type: Boolean,
    default: false
  },

  is_deleted: {
    type: Boolean,
    default: false
  },

  deleted_at: {
    type: Date,
    default: null
  },

  updated_at: {
    type: Date,
    default: Date.now
  },
  
  parsing_confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
