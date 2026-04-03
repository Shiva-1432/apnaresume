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
const { sendError } = require('../utils/apiResponse');

const router = express.Router();

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '').trim());
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const text = String(value || '').trim().toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return null;
}

function toResumeStatus(resume) {
  if (!resume) return 'active';
  if (resume.status === 'analyzing') return 'analyzing';
  if (resume.is_deleted || resume.status === 'deleted') return 'deleted';
  return 'active';
}

function toResumeDto(resume) {
  const source = resume?.toObject ? resume.toObject() : resume;
  const status = toResumeStatus(source);

  return {
    ...source,
    id: String(source?._id || source?.id || ''),
    name: String(source?.version_name || source?.file_name || source?.target_role || 'Resume'),
    format: source?.format || 'pdf',
    score: Number(source?.score || 0),
    updatedAt: new Date(source?.updated_at || source?.created_at || Date.now()).toISOString(),
    createdAt: new Date(source?.created_at || Date.now()).toISOString(),
    status,
    pages: Number(source?.pages || 1),
    starred: Boolean(source?.starred),
    userId: String(source?.user_id || '')
  };
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
      return sendError(res, 400, `Resume file is too large. Maximum allowed size is ${Math.round(MAX_RESUME_SIZE_BYTES / (1024 * 1024))}MB.`, 'BAD_REQUEST');
    }

    return sendError(res, 400, error.message || 'Invalid resume file. Only PDF files are supported.', 'BAD_REQUEST');
  });
}

async function computeUsageByResume(userId) {
  const applications = await JobApplication.find({
    user_id: userId,
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

  return usageByResume;
}

async function runResumeAnalysis({ resume, extractedText, userId, fallbackCredits = 0 }) {
  const model = getGeminiModel('gemini-pro');

  const prompt = `Analyze this resume for ATS compatibility:\n\n${extractedText}\n\nProvide response ONLY in this JSON format (no markdown, no extra text):\n{\n  "ats_score": <number 1-100>,\n  "score_breakdown": {\n    "format": <number>,\n    "keywords": <number>,\n    "experience": <number>,\n    "education": <number>\n  },\n  "strengths": ["strength1", "strength2", "strength3"],\n  "weaknesses": ["weakness1", "weakness2"],\n  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]\n}`;

  try {
    const result = await generateContentWithRetry(model, prompt, {
      maxAttempts: 3,
      baseDelayMs: 800
    });
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    const analysisResult = new AnalysisResult({
      _id: new mongoose.Types.ObjectId(),
      user_id: userId,
      resume_id: resume._id,
      ats_score: Number(analysis.ats_score || 0),
      score_breakdown: analysis.score_breakdown,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      confidence: 'high'
    });

    await analysisResult.save();

    resume.score = Number(analysisResult.ats_score || 0);
    resume.status = 'active';
    resume.analysis_error = null;
    resume.updated_at = new Date();
    await resume.save();

    const user = await User.findById(userId);
    if (user) {
      user.credits = Math.max(0, Number(user.credits || 0) - 5);
      await user.save();
    }

    return {
      analysisResult,
      creditsRemaining: user ? user.credits : Number(fallbackCredits || 0)
    };
  } catch (error) {
    resume.status = 'active';
    resume.analysis_error = error.message || 'Analysis failed';
    resume.updated_at = new Date();
    await resume.save();
    throw error;
  }
}

router.get('/user-resumes', authenticateToken, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 12);
    const skip = (page - 1) * limit;
    const sortField = String(req.query.sort || 'updatedAt');
    const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const tier = String(req.query.tier || '').toLowerCase();
    const starred = parseBoolean(req.query.starred);

    const query = {
      user_id: req.user.user_id,
      is_deleted: { $ne: true }
    };

    if (typeof starred === 'boolean') {
      query.starred = starred;
    }

    if (tier === 'poor') {
      query.score = { $lt: 50 };
    } else if (tier === 'average') {
      query.score = { $gte: 50, $lt: 75 };
    } else if (tier === 'good') {
      query.score = { $gte: 75 };
    }

    const sortMap = {
      updatedAt: 'updated_at',
      score: 'score',
      name: 'file_name'
    };

    const sortKey = sortMap[sortField] || 'updated_at';

    const resumeQuery = Resume.find(query).sort({ [sortKey]: order });
    const usageByResume = await computeUsageByResume(req.user.user_id);

    let resumes;
    let total = 0;

    if (resumeQuery && typeof resumeQuery.skip === 'function') {
      const [pagedResumes, countedTotal] = await Promise.all([
        resumeQuery.skip(skip).limit(limit),
        typeof Resume.countDocuments === 'function' ? Resume.countDocuments(query) : Promise.resolve(null)
      ]);

      resumes = Array.isArray(pagedResumes) ? pagedResumes : [];

      if (Number.isFinite(Number(countedTotal))) {
        total = Number(countedTotal);
      } else {
        const allResumes = await Resume.find(query).sort({ [sortKey]: order });
        total = Array.isArray(allResumes) ? allResumes.length : resumes.length;
      }
    } else {
      const rawResumes = await resumeQuery;
      const list = Array.isArray(rawResumes) ? rawResumes : [];
      total = list.length;
      resumes = list.slice(skip, skip + limit);
    }

    const decoratedResumes = resumes.map((resume) => {
      const dto = toResumeDto(resume);
      const stats = usageByResume[dto.id] || {
        applications_count: 0,
        shortlist_count: 0
      };

      return {
        ...dto,
        ...stats
      };
    });

    return res.json({
      success: true,
      resumes: decoratedResumes,
      total,
      page,
      limit,
      data: decoratedResumes,
      hasMore: (page * limit) < total
    });
  } catch (error) {
    console.error('User resumes fetch error:', error);
    return sendError(res, 500, 'Failed to fetch resumes', 'INTERNAL_ERROR');
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
      resumes: resumes.map((resume) => toResumeDto(resume))
    });
  } catch (error) {
    console.error('Trash fetch error:', error);
    return sendError(res, 500, 'Failed to fetch deleted resumes', 'INTERNAL_ERROR');
  }
});

router.patch('/resume/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const starred = parseBoolean(req.body?.starred);

    if (!isValidObjectId(resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    if (typeof starred !== 'boolean') {
      return sendError(res, 422, 'Body must include starred: boolean', 'VALIDATION_ERROR');
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user_id: req.user.user_id
    });

    if (!resume) {
      return sendError(res, 404, 'Resume not found', 'NOT_FOUND');
    }

    resume.starred = starred;
    resume.updated_at = new Date();
    await resume.save();

    return res.json({
      success: true,
      resume: toResumeDto(resume)
    });
  } catch (error) {
    console.error('Resume patch error:', error);
    return sendError(res, 500, 'Failed to update resume', 'INTERNAL_ERROR');
  }
});

router.get('/resume/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!isValidObjectId(resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user_id: req.user.user_id
    });

    if (!resume) {
      return sendError(res, 404, 'Resume not found', 'NOT_FOUND');
    }

    const status = toResumeStatus(resume);

    if (status === 'analyzing') {
      return res.json({
        success: true,
        resume: {
          id: String(resume._id),
          status
        },
        analysis: null
      });
    }

    const analysis = await AnalysisResult.findOne({
      user_id: req.user.user_id,
      resume_id: resume._id
    });

    const resumePayload = resume?.toObject ? resume.toObject() : resume;

    return res.json({
      success: true,
      resume: {
        ...resumePayload,
        ...toResumeDto(resume),
        status
      },
      analysis: analysis || null
    });
  } catch (error) {
    console.error('Resume detail error:', error);
    return sendError(res, 500, 'Failed to fetch resume details', 'INTERNAL_ERROR');
  }
});

router.delete('/resume/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const shouldPermanentlyDelete = String(req.query.permanent || '').toLowerCase() === 'true';

    if (!isValidObjectId(resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    if (shouldPermanentlyDelete) {
      const deletedResume = await Resume.findOne({
        _id: resumeId,
        user_id: req.user.user_id,
        is_deleted: true
      });

      if (!deletedResume) {
        return sendError(res, 404, 'Deleted resume not found', 'NOT_FOUND');
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
      return sendError(res, 404, 'Resume not found', 'NOT_FOUND');
    }

    resume.is_deleted = true;
    resume.status = 'deleted';
    resume.deleted_at = new Date();
    resume.updated_at = new Date();
    await resume.save();

    return res.json({
      success: true,
      message: 'Resume moved to trash',
      resume: toResumeDto(resume)
    });
  } catch (error) {
    console.error('Resume delete error:', error);
    return sendError(res, 500, 'Failed to delete resume', 'INTERNAL_ERROR');
  }
});

router.post('/resume/:resumeId/restore', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!isValidObjectId(resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user_id: req.user.user_id,
      is_deleted: true
    });

    if (!resume) {
      return sendError(res, 404, 'Deleted resume not found', 'NOT_FOUND');
    }

    resume.is_deleted = false;
    resume.status = 'active';
    resume.deleted_at = null;
    resume.updated_at = new Date();
    await resume.save();

    return res.json({
      success: true,
      message: 'Resume restored successfully',
      resume: toResumeDto(resume)
    });
  } catch (error) {
    console.error('Resume restore error:', error);
    return sendError(res, 500, 'Failed to restore resume', 'INTERNAL_ERROR');
  }
});

router.post(
  '/upload-and-analyze',
  validateResumeUpload,
  handleValidationErrors,
  authenticateToken,
  analyzeResumeQuota,
  checkCredits(5),
  uploadResume,
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'No file uploaded', 'BAD_REQUEST');
      }

      let extractedText = '';
      try {
        const data = await pdfParse(req.file.buffer);
        extractedText = String(data?.text || '').trim();
      } catch (error) {
        return sendError(res, 422, 'Could not read this PDF file', 'VALIDATION_ERROR');
      }

      if (extractedText.length < MIN_EXTRACTED_TEXT_CHARS) {
        return sendError(res, 400, 'Could not extract text from PDF', 'BAD_REQUEST');
      }

      const resume = new Resume({
        _id: new mongoose.Types.ObjectId(),
        user_id: req.user.user_id,
        file_name: req.file.originalname,
        extracted_text: extractedText,
        parsing_confidence: 'high',
        is_deleted: false,
        status: 'analyzing',
        format: String(req.file.originalname || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
        pages: 1,
        score: 0,
        starred: false,
        deleted_at: null,
        updated_at: new Date()
      });

      await resume.save();

      const analysisPromise = runResumeAnalysis({
        resume,
        extractedText,
        userId: req.user.user_id,
        fallbackCredits: Number(req.fullUser?.credits || 0)
      });

      const raceResult = await Promise.race([
        analysisPromise
          .then((value) => ({ type: 'done', value }))
          .catch((error) => ({ type: 'error', error })),
        new Promise((resolve) => {
          setTimeout(() => resolve({ type: 'timeout' }), 2000);
        })
      ]);

      if (raceResult.type === 'timeout') {
        analysisPromise.catch((error) => {
          console.error('Background analysis failed:', error);
        });

        return res.json({
          success: true,
          resumeId: String(resume._id),
          status: 'analyzing',
          mode: 'async'
        });
      }

      if (raceResult.type === 'error') {
        throw raceResult.error;
      }

      return res.json({
        success: true,
        resume: toResumeDto(resume),
        analysis: raceResult.value.analysisResult,
        credits_remaining: raceResult.value.creditsRemaining,
        feature_quota: req.featureQuota,
        mode: 'sync',
        message: 'Resume analyzed successfully'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      return sendError(res, 500, error.message || 'Analysis failed', 'INTERNAL_ERROR');
    }
  }
);

module.exports = router;
