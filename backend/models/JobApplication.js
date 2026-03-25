const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  job_title: { type: String, required: true },
  company: { type: String, required: true },
  job_url: String,
  job_description: String,

  resume_used: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },

  applied_date: { type: Date, default: Date.now },

  status: {
    type: String,
    enum: ['applied', 'viewed', 'shortlisted', 'interview', 'rejected', 'offer'],
    default: 'applied'
  },
  status_updated_at: { type: Date, default: Date.now },

  match_score: Number,

  notes: String,

  feedback_collected: { type: Boolean, default: false },
  feedback_notes: String
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
