const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const User = require('../models/User');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const JobApplication = require('../models/JobApplication');
const { authenticateToken } = require('../middleware/auth');
const { createFeatureQuota } = require('../middleware/featureQuota');
const { validateResumeUpload, handleValidationErrors } = require('../middleware/validation');
const { getGeminiModel, generateContentWithRetry } = require('../utils/ai');
const { checkCredits } = require('../middleware/creditCheck');

const router = express.Router();

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '').trim());
}

const analyzeResumeQuota = createFeatureQuota('resume_analysis', {
  free: {
    hourlyLimit: Number(process.env.ANALYSIS_FREE_LIMIT_PER_HOUR || 10),
    dailyLimit: Number(process.env.ANALYSIS_FREE_LIMIT_PER_DAY || 30)
  },
  paid: {
    hourlyLimit: Number(process.env.ANALYSIS_PAID_LIMIT_PER_HOUR || 40),
    dailyLimit: Number(process.env.ANALYSIS_PAID_LIMIT_PER_DAY || 120)
  }
});

const MAX_RESUME_SIZE_BYTES = Number(process.env.MAX_RESUME_SIZE_BYTES || (5 * 1024 * 1024));
const MIN_EXTRACTED_TEXT_CHARS = Number(process.env.MIN_EXTRACTED_TEXT_CHARS || 200);

// Multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf' && !String(file.originalname || '').toLowerCase().endsWith('.pdf')) {
      return cb(new Error('Only PDF files allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_RESUME_SIZE_BYTES }
});

function uploadResume(req, res, next) {
  upload.single('resume')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Resume file is too large',
        message: `Maximum allowed size is ${Math.round(MAX_RESUME_SIZE_BYTES / (1024 * 1024))}MB.`
      });
    }

    return res.status(400).json({
      error: 'Invalid resume file',
      message: error.message || 'Only PDF files are supported.'
    });
  });
}

// LIST USER RESUMES (base + versions)
router.get('/user-resumes', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({
      user_id: req.user.user_id,
      is_deleted: { $ne: true }
    }).sort({ created_at: -1 });
    const applications = await JobApplication.find({
      user_id: req.user.user_id,
      resume_used: { $ne: null }
    }).select('resume_used status');

    const usageByResume = {};

    for (const app of applications) {
      const resumeId = app.resume_used?.toString();
      if (!resumeId) {
        continue;
      }

      if (!usageByResume[resumeId]) {
        usageByResume[resumeId] = {
          applications_count: 0,
          shortlist_count: 0
        };
      }

      usageByResume[resumeId].applications_count += 1;
      if (app.status === 'shortlisted' || app.status === 'interview' || app.status === 'offer') {
        usageByResume[resumeId].shortlist_count += 1;
      }
    }

    const decoratedResumes = resumes.map((resume) => {
      const stats = usageByResume[resume._id.toString()] || {
        applications_count: 0,
        shortlist_count: 0
      };

      return {
        ...resume.toObject(),
        ...stats
      };
    });

    res.json({
      success: true,
      resumes: decoratedResumes
    });
  } catch (error) {
    console.error('User resumes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({
      user_id: req.user.user_id,
      is_deleted: true
    }).sort({ deleted_at: -1, created_at: -1 });

    return res.json({
      success: true,
      resumes
    });
  } catch (error) {
    console.error('Trash fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch deleted resumes' });
  }
});

router.get('/resume/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!isValidObjectId(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume id format' });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user_id: req.user.user_id,
      is_deleted: { $ne: true }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const analysis = await AnalysisResult.findOne({
      user_id: req.user.user_id,
      resume_id: resume._id
    });

    return res.json({
      success: true,
      resume,
      analysis: analysis || null
    });
  } catch (error) {
    console.error('Resume detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch resume details' });
  }
});

router.delete('/resume/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const shouldPermanentlyDelete = String(req.query.permanent || '').toLowerCase() === 'true';

    if (!isValidObjectId(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume id format' });
    }

    if (shouldPermanentlyDelete) {
      const deletedResume = await Resume.findOne({
        _id: resumeId,
        user_id: req.user.user_id,
        is_deleted: true
      });

      if (!deletedResume) {
        return res.status(404).json({ error: 'Deleted resume not found' });
      }

      await Resume.deleteOne({
        _id: resumeId,
        user_id: req.user.user_id,
        is_deleted: true
      });

      return res.json({
        success: true,
        message: 'Resume permanently deleted'
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user_id: req.user.user_id,
      is_deleted: { $ne: true }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    resume.is_deleted = true;
    resume.deleted_at = new Date();
    resume.updated_at = new Date();
    await resume.save();

    return res.json({
      success: true,
      message: 'Resume moved to trash',
      resume
    });
  } catch (error) {
    console.error('Resume delete error:', error);
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
});

router.post('/resume/:resumeId/restore', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!isValidObjectId(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume id format' });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user_id: req.user.user_id,
      is_deleted: true
    });

    if (!resume) {
      return res.status(404).json({ error: 'Deleted resume not found' });
    }

    resume.is_deleted = false;
    resume.deleted_at = null;
    resume.updated_at = new Date();
    await resume.save();

    return res.json({
      success: true,
      message: 'Resume restored successfully',
      resume
    });
  } catch (error) {
    console.error('Resume restore error:', error);
    return res.status(500).json({ error: 'Failed to restore resume' });
  }
});

// UPLOAD & ANALYZE endpoint
router.post(
  '/upload-and-analyze',
  validateResumeUpload,
  handleValidationErrors,
  authenticateToken,
  analyzeResumeQuota,
  checkCredits(5), // New credit validation middleware
  uploadResume,
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text from PDF
    let extractedText = '';
    try {
      const data = await pdfParse(req.file.buffer);
      extractedText = String(data?.text || '').trim();
    } catch (error) {
      return res.status(422).json({
        error: 'Could not read this PDF file',
        suggestion: 'Re-export the resume as a text-based PDF and try again.'
      });
    }

    // Validate extraction
    if (extractedText.length < MIN_EXTRACTED_TEXT_CHARS) {
      return res.status(400).json({
        error: 'Could not extract text from PDF',
        suggestion: 'Make sure your PDF is text-based, not an image. Export from Word or Google Docs.'
      });
    }

    // Save resume
    const resume = new Resume({
      _id: new (require('mongoose')).Types.ObjectId(),
      user_id: req.user.user_id,
      file_name: req.file.originalname,
      extracted_text: extractedText,
      parsing_confidence: 'high',
      is_deleted: false,
      deleted_at: null,
      updated_at: new Date()
    });

    await resume.save();

    // Call Gemini API for analysis (Centralized Config)
    const model = getGeminiModel('gemini-pro');

    const prompt = `Analyze this resume for ATS compatibility:

${extractedText}

Provide response ONLY in this JSON format (no markdown, no extra text):
{
  "ats_score": <number 1-100>,
  "score_breakdown": {
    "format": <number>,
    "keywords": <number>,
    "experience": <number>,
    "education": <number>
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

    const result = await generateContentWithRetry(model, prompt, {
      maxAttempts: 3,
      baseDelayMs: 800
    });
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Save analysis
    const analysisResult = new AnalysisResult({
      _id: new (require('mongoose')).Types.ObjectId(),
      user_id: req.user.user_id,
      resume_id: resume._id,
      ats_score: analysis.ats_score,
      score_breakdown: analysis.score_breakdown,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      confidence: 'high'
    });

    await analysisResult.save();

    // Deduct credits (using req.fullUser from creditCheck middleware)
    const user = req.fullUser;
    user.credits -= 5;
    await user.save();

    res.json({
      success: true,
      analysis: analysisResult,
      credits_remaining: user.credits,
      feature_quota: req.featureQuota,
      message: 'Resume analyzed successfully'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
}
);

module.exports = router;
