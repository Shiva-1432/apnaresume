const mongoose = require('mongoose');

const jobMatchSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },

  job_description: {
    type: String,
    required: true
  },

  job_title: String,
  company: String,
  job_url: String,
  job_role: String,
  match_percentage: Number,
  match_score: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'excellent', 'good', 'fair', 'poor']
  },

  missing_keywords: [String],
  missing_skills: [String],
  strengths_for_role: [String],
  optimized_bullets: {
    experience: [String],
    skills: [String],
    projects: [String]
  },

  improvements: [String],
  learning_resources: [{
    skill: String,
    resource_name: String,
    url: String,
    time_required: Number
  }],

  created_at: { type: Date, default: Date.now },
  can_be_downloaded: { type: Boolean, default: true }
});

module.exports = mongoose.model('JobMatch', jobMatchSchema);
