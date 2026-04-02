const express = require('express');
const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const SkillGap = require('../models/SkillGap');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { createFeatureQuota } = require('../middleware/featureQuota');
const { getGeminiModel, generateContentWithRetry } = require('../utils/ai');
const { checkCredits } = require('../middleware/creditCheck');

const router = express.Router();

const skillGapQuota = createFeatureQuota('skill_gap_analysis', {
  free: {
    hourlyLimit: Number(process.env.SKILL_GAP_FREE_LIMIT_PER_HOUR || 3),
    dailyLimit: Number(process.env.SKILL_GAP_FREE_LIMIT_PER_DAY || 3)
  },
  paid: {
    hourlyLimit: Number(process.env.SKILL_GAP_PAID_LIMIT_PER_HOUR || 12),
    dailyLimit: Number(process.env.SKILL_GAP_PAID_LIMIT_PER_DAY || 30)
  }
});

router.post('/analyze-skill-gaps', authenticateToken, skillGapQuota, checkCredits(2), async (req, res) => {
  try {
    const { target_role, job_description = '' } = req.body;

    if (!target_role || typeof target_role !== 'string') {
      return res.status(400).json({ error: 'target_role is required' });
    }

    const resume = await Resume.findOne({ user_id: req.user.user_id }).sort({ created_at: -1 });
    if (!resume) {
      return res.status(404).json({ error: 'No resume found for this user' });
    }

    // Use centralized AI model
    const model = getGeminiModel('gemini-pro');

    const skillGapPrompt = `Analyze skill gaps for this user:\n\nTARGET ROLE: ${target_role}\nJOB DESCRIPTION: ${job_description}\n\nUSER'S CURRENT RESUME:\n${resume.extracted_text}\n\nProvide:\n1. Current skills (extracted from resume)\n2. Required skills for the role\n3. Nice-to-have skills\n4. Critical gaps (blocking adoption)\n5. Nice-to-have gaps (good to have)\n6. Estimated learning time for each gap\n7. Free/cheap learning resources\n\nReturn as JSON:\n{\n  "current_skills": ["skill1", "skill2"],\n  "required_skills": ["skill1", "skill2"],\n  "skill_gaps": [\n    {\n      "skill": "AWS",\n      "gap_type": "critical/nice-to-have",\n      "current_level": "none/beginner/intermediate/advanced",\n      "required_level": "intermediate/advanced",\n      "importance": "high/medium/low",\n      "learning_time_hours": 40,\n      "resources": [\n        {\n          "name": "AWS Free Tier",\n          "url": "...",\n          "cost": "free",\n          "time": 40\n        }\n      ]\n    }\n  ],\n  "learning_roadmap": [\n    {\n      "week": 1,\n      "skills": ["skill1"],\n      "resources": ["resource1"]\n    }\n  ]\n}`;

    const analysis = await generateContentWithRetry(model, skillGapPrompt);
    const analysisText = analysis.response.text();
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid skill gap response format from Gemini');
    }
    const skillData = JSON.parse(jsonMatch[0]);

    const skillGap = new SkillGap({
      _id: new mongoose.Types.ObjectId(),
      user_id: req.user.user_id,
      target_role,
      job_description: job_description.substring(0, 5000),
      current_skills: skillData.current_skills || [],
      required_skills: skillData.required_skills || [],
      skill_gaps: skillData.skill_gaps || [],
      learning_roadmap: skillData.learning_roadmap || [],
      created_at: new Date()
    });

    await skillGap.save();

    // Deduct credits (using user from middleware)
    const user = req.fullUser;
    user.credits -= 2;
    await user.save();

    return res.json({
      success: true,
      skill_gaps: skillData,
      credits_remaining: user.credits,
      feature_quota: req.featureQuota,
      actionable_plan: skillData.learning_roadmap || []
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;
