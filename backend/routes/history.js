const express = require('express');

const JobApplication = require('../models/JobApplication');
const { authenticateToken } = require('../middleware/auth');
const { sendError } = require('../utils/apiResponse');

const router = express.Router();

function mapStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'interview') return 'Interview';
  if (status === 'rejected') return 'Rejected';
  if (status === 'offer') return 'Offer';
  return 'Applied';
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const applications = await JobApplication.find({ user_id: req.user.user_id })
      .sort({ applied_date: -1 })
      .lean();

    return res.json({
      applications: applications.map((application) => ({
        id: String(application._id),
        company: application.company || '',
        role: application.job_title || '',
        appliedDate: new Date(application.applied_date || application.created_at || Date.now()).toISOString(),
        resumeId: application.resume_used ? String(application.resume_used) : null,
        status: mapStatus(application.status),
        notes: application.notes || ''
      }))
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return sendError(res, 500, 'Failed to fetch history', 'INTERNAL_ERROR');
  }
});

module.exports = router;
