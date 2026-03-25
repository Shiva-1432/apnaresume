const express = require('express');
const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const AnalysisResult = require('../models/AnalysisResult');
const JobMatch = require('../models/JobMatch');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/track-application', authenticateToken, async (req, res) => {
  try {
    const { job_title, company, job_description, resume_id, job_url, match_score, notes } = req.body;

    if (!job_title || !company) {
      return res.status(400).json({ error: 'job_title and company are required' });
    }

    const app = new JobApplication({
      _id: new mongoose.Types.ObjectId(),
      user_id: req.user.user_id,
      job_title,
      company,
      job_url,
      job_description,
      resume_used: resume_id,
      applied_date: new Date(),
      status_updated_at: new Date(),
      match_score,
      notes
    });

    await app.save();

    return res.json({
      success: true,
      message: 'Application tracked!',
      tips: [
        "You'll get notifications when we detect status changes",
        "After 2 weeks, we'll suggest improvements if no response",
        'Track your success rate by role'
      ]
    });
  } catch (error) {
    console.error('Track application error:', error);
    return res.status(500).json({ error: 'Failed to track application' });
  }
});

router.get('/list', authenticateToken, async (req, res) => {
  try {
    const apps = await JobApplication.find({ user_id: req.user.user_id }).sort({ applied_date: -1 });
    return res.json({ success: true, applications: apps });
  } catch (error) {
    console.error('Application list error:', error);
    return res.status(500).json({ error: 'Failed to get applications' });
  }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatus = ['applied', 'viewed', 'shortlisted', 'interview', 'rejected', 'offer'];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const app = await JobApplication.findOne({ _id: id, user_id: req.user.user_id });
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    app.status = status;
    app.status_updated_at = new Date();
    await app.save();

    return res.json({ success: true, application: app });
  } catch (error) {
    console.error('Application status update error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

router.get('/application-stats', authenticateToken, async (req, res) => {
  try {
    const apps = await JobApplication.find({ user_id: req.user.user_id });
    const total = apps.length;

    const interviewOrOffer = apps.filter((a) => a.status === 'interview' || a.status === 'offer').length;
    const totalMatchScore = apps.reduce((sum, a) => sum + (a.match_score || 0), 0);

    const stats = {
      total_applications: total,
      by_status: {
        applied: apps.filter((a) => a.status === 'applied').length,
        shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
        interviewed: apps.filter((a) => a.status === 'interview').length,
        offers: apps.filter((a) => a.status === 'offer').length,
        rejected: apps.filter((a) => a.status === 'rejected').length
      },
      success_rate: total > 0 ? ((interviewOrOffer / total) * 100).toFixed(1) : '0.0',
      avg_match_score: total > 0 ? (totalMatchScore / total).toFixed(0) : '0'
    };

    return res.json(stats);
  } catch (error) {
    console.error('Application stats error:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const [
      apps,
      totalAnalyses,
      totalMatches
    ] = await Promise.all([
      JobApplication.find({ user_id: req.user.user_id }),
      AnalysisResult.countDocuments({ user_id: req.user.user_id }),
      JobMatch.countDocuments({ user_id: req.user.user_id })
    ]);

    const totalApplications = apps.length;
    const interviewOrOffer = apps.filter((a) => a.status === 'interview' || a.status === 'offer').length;

    return res.json({
      success: true,
      total_analyses: totalAnalyses,
      total_matches: totalMatches,
      total_applications: totalApplications,
      success_rate: totalApplications > 0 ? Number(((interviewOrOffer / totalApplications) * 100).toFixed(1)) : 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

module.exports = router;
