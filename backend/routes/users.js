const express = require('express');

const User = require('../models/User');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const JobMatch = require('../models/JobMatch');
const JobApplication = require('../models/JobApplication');
const SupportTicket = require('../models/SupportTicket');
const Payment = require('../models/Payment');
const FeatureUsage = require('../models/FeatureUsage');
const { authenticateToken } = require('../middleware/auth');
const { sendError } = require('../utils/apiResponse');

const router = express.Router();

router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const displayName = req.body?.displayName;
    const emailNotifications = req.body?.emailNotifications;
    const weeklyDigest = req.body?.weeklyDigest;
    const tips = req.body?.tips;

    if (
      displayName === undefined &&
      emailNotifications === undefined &&
      weeklyDigest === undefined &&
      tips === undefined
    ) {
      return sendError(res, 422, 'At least one preference field is required', 'VALIDATION_ERROR');
    }

    const user = await User.findById(req.user.user_id);
    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
    }

    user.preferences = user.preferences || {};

    if (displayName !== undefined) {
      const cleaned = String(displayName || '').trim();
      if (!cleaned) {
        return sendError(res, 422, 'displayName cannot be empty', 'VALIDATION_ERROR');
      }

      user.preferences.display_name = cleaned;
      user.name = cleaned;
    }

    if (emailNotifications !== undefined) {
      user.preferences.email_notifications = Boolean(emailNotifications);
    }

    if (weeklyDigest !== undefined) {
      user.preferences.weekly_digest = Boolean(weeklyDigest);
    }

    if (tips !== undefined) {
      user.preferences.tips = Boolean(tips);
    }

    await user.save();

    return res.json({
      preferences: {
        displayName: user.preferences.display_name || user.name,
        emailNotifications: Boolean(user.preferences.email_notifications),
        weeklyDigest: Boolean(user.preferences.weekly_digest),
        tips: Boolean(user.preferences.tips)
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return sendError(res, 500, 'Failed to update preferences', 'INTERNAL_ERROR');
  }
});

router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const confirmation = String(req.body?.confirmation || '').trim();
    if (confirmation !== 'DELETE') {
      return sendError(res, 422, "Body must include confirmation: 'DELETE'", 'VALIDATION_ERROR');
    }

    const userId = req.user.user_id;

    await Promise.all([
      AnalysisResult.deleteMany({ user_id: userId }),
      JobMatch.deleteMany({ user_id: userId }),
      JobApplication.deleteMany({ user_id: userId }),
      Resume.deleteMany({ user_id: userId }),
      SupportTicket.deleteMany({ user_id: userId }),
      Payment.deleteMany({ user_id: userId }),
      FeatureUsage.deleteMany({ user_id: userId }),
      User.deleteOne({ _id: userId })
    ]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return sendError(res, 500, 'Failed to delete account', 'INTERNAL_ERROR');
  }
});

module.exports = router;
