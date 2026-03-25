const mongoose = require('mongoose');

const skillResourceSchema = new mongoose.Schema({
  name: String,
  url: String,
  cost: String,
  time: Number
}, { _id: false });

const skillGapItemSchema = new mongoose.Schema({
  skill: String,
  gap_type: {
    type: String,
    enum: ['critical', 'nice-to-have']
  },
  current_level: {
    type: String,
    enum: ['none', 'beginner', 'intermediate', 'advanced']
  },
  required_level: {
    type: String,
    enum: ['intermediate', 'advanced']
  },
  importance: {
    type: String,
    enum: ['high', 'medium', 'low']
  },
  learning_time_hours: Number,
  resources: [skillResourceSchema]
}, { _id: false });

const roadmapItemSchema = new mongoose.Schema({
  week: Number,
  skills: [String],
  resources: [String]
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target_role: {
    type: String,
    required: true,
    trim: true
  },
  job_description: {
    type: String,
    default: ''
  },
  current_skills: [String],
  required_skills: [String],
  skill_gaps: [skillGapItemSchema],
  learning_roadmap: [roadmapItemSchema],
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SkillGap', skillGapSchema);
