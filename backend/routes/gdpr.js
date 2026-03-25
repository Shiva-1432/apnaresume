const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const JobMatch = require('../models/JobMatch');
const JobApplication = require('../models/JobApplication');
const SkillGap = require('../models/SkillGap');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// EXPORT USER DATA
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [
      user,
      resumes,
      analyses,
      jobMatches,
      applications,
      skillGaps,
      payments,
      supportTickets
    ] = await Promise.all([
      User.findById(userId).select(
        '-password -verification.verification_token -password_reset.reset_token'
      ),
      Resume.find({ user_id: userId }),
      AnalysisResult.find({ user_id: userId }),
      JobMatch.find({ user_id: userId }),
      JobApplication.find({ user_id: userId }),
      SkillGap.find({ user_id: userId }),
      Payment.find({ user_id: userId }),
      SupportTicket.find({ user_id: userId })
    ]);

    const userData = {
      user,
      resumes,
      analyses,
      jobMatches,
      applications,
      skillGaps,
      payments,
      supportTickets,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="apnaresume-data-export-${new Date().toISOString().split('T')[0]}.json"`
    );

    return res.json(userData);
  } catch (error) {
    console.error('Export data error:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
});

// DELETE ACCOUNT & ALL DATA
router.post('/delete-account', authenticateToken, async (req, res) => {
  try {
    const { password, confirm } = req.body || {};

    if (!confirm || confirm !== 'DELETE') {
      return res.status(400).json({
        error: 'Confirmation required',
        details: 'Please type DELETE to confirm account deletion'
      });
    }

    if (!password) {
      return res.status(400).json({
        error: 'Password required',
        details: 'Please provide your password to delete account'
      });
    }

    const userId = req.user.user_id;

    const user = await User.findById(userId).select('password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Password incorrect' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Resume.deleteMany({ user_id: userId }, { session });
      await AnalysisResult.deleteMany({ user_id: userId }, { session });
      await JobMatch.deleteMany({ user_id: userId }, { session });
      await JobApplication.deleteMany({ user_id: userId }, { session });
      await SkillGap.deleteMany({ user_id: userId }, { session });
      await Payment.deleteMany({ user_id: userId }, { session });
      await SupportTicket.deleteMany({ user_id: userId }, { session });
      await User.findByIdAndDelete(userId, { session });

      await session.commitTransaction();

      return res.json({
        success: true,
        message: '✓ Account and all associated data have been deleted'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
