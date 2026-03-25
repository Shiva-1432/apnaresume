const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  ats_score: {
    type: Number,
    min: 0,
    max: 100
  },
  
  score_breakdown: {
    format: Number,
    keywords: Number,
    experience: Number,
    education: Number
  },
  
  strengths: [String],
  weaknesses: [String],
  suggestions: [String],
  
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low']
  },
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnalysisResult', analysisSchema);
