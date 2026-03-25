const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const { authenticateToken } = require('../middleware/auth');
const { generateContentWithRetry } = require('../utils/ai');

const router = express.Router();

router.get('/list', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user_id: req.user.user_id }).sort({ created_at: -1 });

    return res.json({
      success: true,
      resumes,
      base_resumes: resumes.filter((resume) => !resume.is_version),
      versions: resumes.filter((resume) => resume.is_version)
    });
  } catch (error) {
    console.error('Resume list error:', error);
    return res.status(500).json({ error: 'Failed to fetch resume versions' });
  }
});

router.get('/performance-stats', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user_id: req.user.user_id }).sort({ created_at: -1 });
    const applications = await JobApplication.find({
      user_id: req.user.user_id,
      resume_used: { $ne: null }
    });

    const statsByResume = {};

    for (const app of applications) {
      const resumeId = app.resume_used?.toString();
      if (!resumeId) {
        continue;
      }

      if (!statsByResume[resumeId]) {
        statsByResume[resumeId] = {
          applications: 0,
          shortlisted: 0,
          interviewed: 0,
          offers: 0
        };
      }

      statsByResume[resumeId].applications += 1;
      if (app.status === 'shortlisted') {
        statsByResume[resumeId].shortlisted += 1;
      }
      if (app.status === 'interview') {
        statsByResume[resumeId].interviewed += 1;
      }
      if (app.status === 'offer') {
        statsByResume[resumeId].offers += 1;
      }
    }

    let bestResumeId = null;
    let bestScore = -1;

    const performance = resumes.map((resume) => {
      const id = resume._id.toString();
      const resumeStats = statsByResume[id] || {
        applications: 0,
        shortlisted: 0,
        interviewed: 0,
        offers: 0
      };

      const successRate = resumeStats.applications > 0
        ? Number(((resumeStats.offers + resumeStats.interviewed) / resumeStats.applications * 100).toFixed(1))
        : 0;

      const score = (resumeStats.offers * 3) + (resumeStats.interviewed * 2) + resumeStats.shortlisted;
      if (score > bestScore) {
        bestScore = score;
        bestResumeId = id;
      }

      return {
        resume_id: id,
        version_name: resume.version_name || resume.file_name || 'Resume',
        is_version: resume.is_version,
        target_role: resume.target_role || null,
        created_at: resume.created_at,
        ...resumeStats,
        success_rate: successRate
      };
    });

    return res.json({
      success: true,
      best_resume_id: bestResumeId,
      performance
    });
  } catch (error) {
    console.error('Resume performance stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch performance stats' });
  }
});

router.post('/create-role-version', authenticateToken, async (req, res) => {
  try {
    const { base_resume_id, target_role } = req.body;
    const normalizedRole = String(target_role || '').trim();

    if (!base_resume_id || !normalizedRole) {
      return res.status(400).json({ error: 'base_resume_id and target_role are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(String(base_resume_id))) {
      return res.status(400).json({ error: 'Invalid base_resume_id format' });
    }

    if (normalizedRole.length < 2 || normalizedRole.length > 120) {
      return res.status(400).json({ error: 'target_role must be between 2 and 120 characters' });
    }

    const baseResume = await Resume.findById(base_resume_id);
    if (!baseResume) {
      return res.status(404).json({ error: 'Base resume not found' });
    }

    if (baseResume.user_id.toString() !== req.user.user_id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const prompt = `Optimize this resume for a ${normalizedRole} position:\n\n${baseResume.extracted_text}\n\nFocus on:\n1. Reorder bullet points by relevance to ${normalizedRole}\n2. Emphasize relevant skills\n3. Downplay irrelevant experience\n4. Add keywords common in ${normalizedRole} roles\n\nReturn as optimized text (not JSON, just the resume content)`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const optimized = await generateContentWithRetry(model, prompt, {
      maxAttempts: 3,
      baseDelayMs: 700
    });

    const version = new Resume({
      _id: new mongoose.Types.ObjectId(),
      user_id: req.user.user_id,
      parent_resume_id: base_resume_id,
      target_role: normalizedRole,
      extracted_text: optimized.response.text(),
      version_name: `${normalizedRole} Optimized`,
      is_version: true,
      parsing_confidence: baseResume.parsing_confidence || 'medium'
    });

    await version.save();

    return res.json({
      success: true,
      version,
      message: `Created resume version for ${normalizedRole}`
    });
  } catch (error) {
    console.error('Resume version creation error:', error);
    return res.status(500).json({ error: 'Version creation failed' });
  }
});

module.exports = router;
