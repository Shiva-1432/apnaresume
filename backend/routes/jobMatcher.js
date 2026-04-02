const express = require('express');
const mongoose = require('mongoose');
const JobMatch = require('../models/JobMatch');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { createFeatureQuota } = require('../middleware/featureQuota');
const { getGeminiModel, generateContentWithRetry } = require('../utils/ai');
const { checkCredits } = require('../middleware/creditCheck');

const router = express.Router();

const jobMatcherQuota = createFeatureQuota('job_match', {
  free: {
    hourlyLimit: Number(process.env.JOB_MATCH_FREE_LIMIT_PER_HOUR || 5),
    dailyLimit: Number(process.env.JOB_MATCH_FREE_LIMIT_PER_DAY || 5)
  },
  paid: {
    hourlyLimit: Number(process.env.JOB_MATCH_PAID_LIMIT_PER_HOUR || 20),
    dailyLimit: Number(process.env.JOB_MATCH_PAID_LIMIT_PER_DAY || 40)
  }
});

// Main endpoint: Match resume to job
router.post('/match-resume-to-job', authenticateToken, jobMatcherQuota, checkCredits(3), async (req, res) => {
  try {
    const { job_description, resume_id, job_title, company } = req.body;
    const normalizedJobDescription = String(job_description || '').trim();
    const normalizedResumeId = String(resume_id || '').trim();
    const normalizedJobTitle = String(job_title || '').trim();
    const normalizedCompany = String(company || '').trim();

    // Validate input
    if (!normalizedJobDescription || !normalizedResumeId) {
      return res.status(400).json({ error: 'Job description and resume required' });
    }

    if (normalizedJobDescription.length < 100) {
      return res.status(400).json({ error: 'Job description is too short for meaningful matching' });
    }

    if (normalizedJobDescription.length > 15000) {
      return res.status(400).json({ error: 'Job description is too long. Keep it under 15,000 characters.' });
    }

    if (!mongoose.Types.ObjectId.isValid(normalizedResumeId)) {
      return res.status(400).json({ error: 'Invalid resume_id format' });
    }

    // Get user's resume
    const resume = await Resume.findOne({
      _id: normalizedResumeId,
      user_id: req.user.user_id,
      is_deleted: { $ne: true }
    });

    if (!resume) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // User already fetched and validated by checkCredits middleware (req.fullUser)
    const user = req.fullUser;

    console.log('Analyzing job...');

    // STEP 1: Extract job requirements
    const extractJobPrompt = `Extract structured requirements from this job description.

JOB DESCRIPTION:
${job_description}

Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "exact job title",
  "company": "company name if mentioned",
  "role_type": "backend/frontend/fullstack/data-science/devops/cloud/mobile/other",
  "experience_level": "fresher/junior/mid/senior/lead",
  "key_responsibilities": ["resp1", "resp2", "resp3"],
  "required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "technologies": ["tech1", "tech2"],
  "salary_range": "if mentioned or null",
  "location": "if mentioned or null"
}`;

    // Get model from centralized provider
    const model = getGeminiModel('gemini-1.5-flash');

    let jobData;
    try {
      const jobResponse = await generateContentWithRetry(model, extractJobPrompt, {
        maxAttempts: 3,
        baseDelayMs: 800
      });
      const jobText = jobResponse.response.text();
      const jsonMatch = jobText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid job analysis response');
      }
      jobData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Job extraction error:', error);
      return res.status(500).json({ error: 'Failed to analyze job description' });
    }

    console.log('Job analyzed');
    console.log('Matching resume...');

    // STEP 2: Match resume against job
    const matchPrompt = `Compare this resume against this job. Be SPECIFIC and ACTIONABLE.

RESUME:
${resume.extracted_text}

JOB DETAILS:
Title: ${jobData.title}
Role Type: ${jobData.role_type}
Experience Level: ${jobData.experience_level}
Required Skills: ${jobData.required_skills.join(', ')}
Nice-to-Have: ${jobData.nice_to_have_skills.join(', ')}
Technologies: ${jobData.technologies.join(', ')}
Key Responsibilities: ${jobData.key_responsibilities.join(', ')}

Analyze and return ONLY valid JSON (no markdown):
{
  "match_percentage": <0-100>,
  "match_score": "Excellent/Good/Fair/Poor",
  "match_explanation": "brief explanation",
  "strengths_for_role": ["strength1: why it helps"],
  "weaknesses_for_role": ["weakness1: why it hurts"],
  "missing_keywords": ["keyword1", "keyword2"],
  "missing_skills": ["skill1: criticality high/medium/low"],
  "has_experience": true/false,
  "experience_gap": "junior for mid-level role" or "none",
  "improvements": [
    "specific, actionable improvement 1",
    "specific, actionable improvement 2",
    "specific, actionable improvement 3"
  ]
}`;

    let matchData;
    try {
      const matchResponse = await generateContentWithRetry(model, matchPrompt, {
        maxAttempts: 3,
        baseDelayMs: 800
      });
      const matchText = matchResponse.response.text();
      const jsonMatch = matchText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid match response');
      }
      matchData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Match analysis error:', error);
      return res.status(500).json({ error: 'Failed to match resume' });
    }

    console.log('Resume matched');
    console.log('Generating optimizations...');

    // STEP 3: Generate optimized bullet points
    const optimizePrompt = `Rewrite resume bullets to match this job.

ORIGINAL RESUME:
${resume.extracted_text}

JOB REQUIREMENTS:
${JSON.stringify(jobData)}

For each section (experience, skills, projects), provide optimized versions that:
1. Emphasize relevant keywords
2. Show fit for the role
3. Use action verbs
4. Include metrics/impact

Return ONLY valid JSON:
{
  "optimized_experience": [
    {
      "original": "original bullet",
      "optimized": "rewritten with keywords and impact",
      "why": "why this is better for this role"
    }
  ],
  "optimized_skills": ["skill1", "skill2"],
  "optimized_projects": [
    {
      "name": "project name",
      "description": "rewritten for this role",
      "impact": "quantified impact"
    }
  ]
}`;

    let optimizeData;
    try {
      const optimizeResponse = await generateContentWithRetry(model, optimizePrompt, {
        maxAttempts: 2,
        baseDelayMs: 700
      });
      const optimizeText = optimizeResponse.response.text();
      const jsonMatch = optimizeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid optimization response');
      }
      optimizeData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Optimization error:', error);
      optimizeData = {
        optimized_experience: [],
        optimized_skills: [],
        optimized_projects: []
      };
    }

    console.log('Optimizations generated');

    // STEP 4: Save job match result
    const jobMatch = new JobMatch({
      _id: new mongoose.Types.ObjectId(),
      user_id: req.user.user_id,
      resume_id: normalizedResumeId,
      job_description: normalizedJobDescription.substring(0, 5000),
      job_title: jobData.title || normalizedJobTitle,
      company: jobData.company || normalizedCompany,
      match_percentage: matchData.match_percentage,
      match_score: matchData.match_score,
      missing_keywords: matchData.missing_keywords,
      missing_skills: matchData.missing_skills,
      strengths_for_role: matchData.strengths_for_role,
      improvements: matchData.improvements,
      optimized_bullets: {
        experience: optimizeData.optimized_experience?.map((e) => e.optimized) || [],
        skills: optimizeData.optimized_skills || [],
        projects: optimizeData.optimized_projects || []
      },
      can_be_downloaded: true,
      created_at: new Date()
    });

    await jobMatch.save();

    // Deduct credits
    user.credits -= 3;
    await user.save();

    console.log('Results saved');

    res.json({
      success: true,
      match_analysis: matchData,
      job_analysis: jobData,
      optimizations: optimizeData,
      job_match_id: jobMatch._id,
      credits_remaining: user.credits,
      feature_quota: req.featureQuota,
      message: `Resume matches ${matchData.match_percentage}% of job requirements`
    });
  } catch (error) {
    console.error('Job matching error:', error);
    res.status(500).json({
      error: 'Job matching failed',
      message: error.message
    });
  }
});

// Download optimized resume
router.get('/download-optimized/:jobMatchId', authenticateToken, async (req, res) => {
  try {
    const jobMatch = await JobMatch.findById(req.params.jobMatchId);

    if (!jobMatch || jobMatch.user_id.toString() !== req.user.user_id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate optimized resume text
    const optimizedText = `
OPTIMIZED RESUME FOR: ${jobMatch.job_title} @ ${jobMatch.company}
Match Score: ${jobMatch.match_percentage}%

[Your Details]

EXPERIENCE (Optimized for ${jobMatch.job_title}):
${jobMatch.optimized_bullets.experience.join('\n')}

SKILLS (Relevant to role):
${jobMatch.optimized_bullets.skills.join(', ')}

PROJECTS (Aligned with requirements):
${jobMatch.optimized_bullets.projects.join('\n')}
`;

    // Create PDF or return as text
    res.json({
      success: true,
      optimized_resume: optimizedText,
      job_title: jobMatch.job_title,
      company: jobMatch.company,
      download_options: {
        format: 'text',
        can_copy_paste: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get match history
router.get('/match-history', authenticateToken, async (req, res) => {
  try {
    const matches = await JobMatch.find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .limit(10);

    res.json({
      success: true,
      matches: matches.map((m) => ({
        id: m._id,
        job_title: m.job_title,
        company: m.company,
        match_percentage: m.match_percentage,
        match_score: m.match_score,
        created_at: m.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
