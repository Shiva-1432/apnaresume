const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const Payment = require('../models/Payment');
const JobApplication = require('../models/JobApplication');
const SupportTicket = require('../models/SupportTicket');
const AdminLog = require('../models/AdminLog');
const { getMetrics } = require('../middleware/performance');

const router = express.Router();

// Middleware: Authenticate + Verify Admin Role
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const adminEmails = ['admin@apnaresume.com', process.env.ADMIN_EMAIL].filter(Boolean);
    const user = await User.findById(req.user.user_id).select('email');

    if (!user || !adminEmails.includes(user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch {
    return res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Log admin action
const logAdminAction = async (adminId, action, targetId, targetType, changes, req) => {
  try {
    const log = new AdminLog({
      _id: new mongoose.Types.ObjectId(),
      admin_id: adminId,
      action,
      target_id: targetId,
      target_type: targetType,
      changes,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
    await log.save();
  } catch (error) {
    console.error('Admin log error:', error);
  }
};

// ============ DASHBOARD METRICS ============
router.get('/dashboard/metrics', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsersLast24h = await User.countDocuments({
      last_login_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const totalResumes = await Resume.countDocuments();
    const totalAnalyses = await AnalysisResult.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalApplications = await JobApplication.countDocuments();
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });

    const analysesThisWeek = await AnalysisResult.countDocuments({
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const paymentsThisWeek = await Payment.countDocuments({
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: 'success'
    });

    return res.json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          active_24h: activeUsersLast24h,
          growth_potential: totalUsers > 0 ? Math.round((activeUsersLast24h / totalUsers) * 100) : 0
        },
        content: {
          total_resumes: totalResumes,
          total_analyses: totalAnalyses,
          analyses_this_week: analysesThisWeek
        },
        revenue: {
          total_revenue: totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0,
          total_payments: totalPayments,
          payments_this_week: paymentsThisWeek
        },
        applications: {
          total: totalApplications
        },
        support: {
          total_tickets: totalTickets,
          open_tickets: openTickets
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ============ USER MANAGEMENT ============
router.get('/users', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const sort = String(req.query.sort || '-created_at');
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password -verification.verification_token -password_reset.reset_token')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Users list error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:userId', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -verification.verification_token -password_reset.reset_token');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await Resume.countDocuments({ user_id: user._id });
    const analyses = await AnalysisResult.countDocuments({ user_id: user._id });
    const applications = await JobApplication.countDocuments({ user_id: user._id });
    const payments = await Payment.find({ user_id: user._id, status: 'success' });
    const totalSpent = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    await logAdminAction(req.user.user_id, 'user_view', user._id, 'User', null, req);

    return res.json({
      success: true,
      user,
      stats: {
        resumes,
        analyses,
        applications,
        payments: payments.length,
        total_spent: totalSpent,
        account_age_days: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error('User detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/users/:userId/adjust-credits', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const reason = String(req.body?.reason || '').trim();

    if (!Number.isFinite(amount) || amount === 0) {
      return res.status(400).json({ error: 'Amount required and must be a non-zero number' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldCredits = Number(user.credits || 0);
    user.credits = oldCredits + amount;
    await user.save();

    await logAdminAction(req.user.user_id, 'quota_adjust', user._id, 'User', {
      old_credits: oldCredits,
      new_credits: user.credits,
      amount,
      reason
    }, req);

    return res.json({
      success: true,
      message: `Credits adjusted from ${oldCredits} to ${user.credits}`,
      user: {
        _id: user._id,
        email: user.email,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Adjust credits error:', error);
    return res.status(500).json({ error: 'Failed to adjust credits' });
  }
});

// ============ PAYMENT MANAGEMENT ============
router.get('/payments', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const query = status === 'all' ? {} : { status };

    const payments = await Payment.find(query)
      .populate('user_id', 'email name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    const successPayments = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return res.json({
      success: true,
      payments,
      stats: {
        total_successful: successPayments.length > 0 ? successPayments[0].total : 0,
        total_transactions: total
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Payments list error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ============ SUPPORT TICKET MANAGEMENT ============
router.get('/support/tickets', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const query = status === 'all' ? {} : { status };

    const tickets = await SupportTicket.find(query)
      .populate('user_id', 'email name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SupportTicket.countDocuments(query);

    return res.json({
      success: true,
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Support tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.post('/support/tickets/:ticketId/respond', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.responses.push({
      _id: new mongoose.Types.ObjectId(),
      responder_id: req.user.user_id,
      message,
      created_at: new Date()
    });

    ticket.status = 'in-progress';
    await ticket.save();

    await logAdminAction(req.user.user_id, 'ticket_respond', ticket._id, 'SupportTicket', {
      message,
      status: ticket.status
    }, req);

    return res.json({
      success: true,
      message: 'Response added to ticket',
      ticket
    });
  } catch (error) {
    console.error('Respond ticket error:', error);
    return res.status(500).json({ error: 'Failed to respond to ticket' });
  }
});

router.get('/logs', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const skip = (page - 1) * limit;

    const logs = await AdminLog.find({})
      .populate('admin_id', 'email name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminLog.countDocuments();

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
});

router.get('/metrics/performance', authenticateToken, verifyAdmin, (req, res) => {
  res.json({
    success: true,
    metrics: getMetrics(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
