const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/User');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const Payment = require('../models/Payment');
const JobApplication = require('../models/JobApplication');
const SupportTicket = require('../models/SupportTicket');
const AdminLog = require('../models/AdminLog');
const FeatureFlag = require('../models/FeatureFlag');
const { getMetrics } = require('../middleware/performance');
const { authenticateToken } = require('../middleware/auth');
const { sendError, sendPaginated } = require('../utils/apiResponse');
const { getGeminiModel, generateContentWithRetry } = require('../utils/ai');

const router = express.Router();

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '').trim());
}

function normalizeResumeStatus(resume) {
  if (resume?.status === 'analyzing') return 'analyzing';
  if (resume?.is_deleted || resume?.status === 'deleted') return 'deleted';
  return 'active';
}

function toResumeDto(resume) {
  const source = resume?.toObject ? resume.toObject() : resume;
  return {
    ...source,
    id: String(source?._id || source?.id || ''),
    name: String(source?.version_name || source?.file_name || source?.target_role || 'Resume'),
    format: source?.format || 'pdf',
    score: Number(source?.score || 0),
    updatedAt: new Date(source?.updated_at || source?.created_at || Date.now()).toISOString(),
    createdAt: new Date(source?.created_at || Date.now()).toISOString(),
    status: normalizeResumeStatus(source),
    pages: Number(source?.pages || 1),
    starred: Boolean(source?.starred),
    userId: String(source?.user_id || '')
  };
}

async function verifyAdmin(req, res, next) {
  try {
    const role = String(
      req.authClaims?.public_metadata?.role ||
      req.authClaims?.metadata?.role ||
      req.authClaims?.role ||
      ''
    ).toLowerCase();

    if (role !== 'admin') {
      return sendError(res, 403, 'Admin access required', 'FORBIDDEN');
    }

    return next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    return sendError(res, 500, 'Admin verification failed', 'INTERNAL_ERROR');
  }
}

async function logAdminAction(adminId, action, targetId, targetType, metadata, req) {
  try {
    const log = new AdminLog({
      _id: new mongoose.Types.ObjectId(),
      admin_id: adminId,
      action,
      target_id: targetId,
      target_type: targetType,
      changes: metadata,
      metadata,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });

    await log.save();
  } catch (error) {
    console.error('Admin log error:', error);
  }
}

async function buildStats() {
  const [
    totalUsers,
    activeUsersLast24h,
    totalResumes,
    totalAnalyses,
    totalPayments,
    totalApplications,
    totalTickets,
    openTickets,
    queuedJobs,
    totalRevenueAgg
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({
      last_login_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    Resume.countDocuments(),
    AnalysisResult.countDocuments(),
    Payment.countDocuments(),
    JobApplication.countDocuments(),
    SupportTicket.countDocuments(),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in-progress', 'waiting-customer'] } }),
    Resume.countDocuments({ status: 'analyzing' }),
    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalRevenue = totalRevenueAgg.length > 0 ? Number(totalRevenueAgg[0].total || 0) : 0;

  return {
    totalUsers,
    activeUsers24h: activeUsersLast24h,
    totalResumes,
    totalAnalyses,
    totalPayments,
    totalRevenue,
    totalApplications,
    totalTickets,
    openSupportTickets: openTickets,
    queuedJobs,
    timestamp: new Date().toISOString()
  };
}

router.use(authenticateToken, verifyAdmin);

router.get('/stats', async (req, res) => {
  try {
    const stats = await buildStats();
    return res.json({ success: true, stats, metrics: stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    return sendError(res, 500, 'Failed to fetch stats', 'INTERNAL_ERROR');
  }
});

router.get('/dashboard/metrics', async (req, res) => {
  try {
    const stats = await buildStats();
    return res.json({
      success: true,
      metrics: {
        users: {
          total: stats.totalUsers,
          active_24h: stats.activeUsers24h
        },
        content: {
          total_resumes: stats.totalResumes,
          total_analyses: stats.totalAnalyses
        },
        revenue: {
          total_revenue: stats.totalRevenue,
          total_payments: stats.totalPayments
        },
        applications: {
          total: stats.totalApplications
        },
        support: {
          total_tickets: stats.totalTickets,
          open_tickets: stats.openSupportTickets
        },
        queue: {
          analyzing: stats.queuedJobs
        },
        timestamp: stats.timestamp
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return sendError(res, 500, 'Failed to fetch metrics', 'INTERNAL_ERROR');
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim().toLowerCase();

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'locked') {
      query.account_locked = true;
    }

    if (status === 'active') {
      query.$or = [...(query.$or || []), { account_locked: { $ne: true } }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -verification.verification_token -password_reset.reset_token')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const data = users.map((user) => user.toObject());

    return sendPaginated(res, {
      extra: {
        success: true,
        users: data,
        pagination: {
          total,
          page,
          limit,
          totalItems: total,
          pages: Math.ceil(total / limit)
        }
      },
      data,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Users list error:', error);
    return sendError(res, 500, 'Failed to fetch users', 'INTERNAL_ERROR');
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.userId)) {
      return sendError(res, 400, 'Invalid user id format', 'BAD_REQUEST');
    }

    const user = await User.findById(req.params.userId)
      .select('-password -verification.verification_token -password_reset.reset_token');

    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
    }

    const [resumes, analyses, applications, payments] = await Promise.all([
      Resume.countDocuments({ user_id: user._id }),
      AnalysisResult.countDocuments({ user_id: user._id }),
      JobApplication.countDocuments({ user_id: user._id }),
      Payment.find({ user_id: user._id, status: 'success' })
    ]);

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
    return sendError(res, 500, 'Failed to fetch user', 'INTERNAL_ERROR');
  }
});

router.patch('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const status = String(req.body?.status || '').trim().toLowerCase();
    const reason = String(req.body?.reason || '').trim();

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, 'Invalid user id format', 'BAD_REQUEST');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
    }

    if (!status) {
      return sendError(res, 422, 'status is required', 'VALIDATION_ERROR');
    }

    if (status === 'locked' || status === 'suspended') {
      user.account_locked = true;
      user.locked_until = null;
    } else if (status === 'active') {
      user.account_locked = false;
      user.locked_until = null;
      user.failed_login_attempts = 0;
    } else {
      return sendError(res, 422, 'Unsupported status value', 'VALIDATION_ERROR');
    }

    await user.save();

    await logAdminAction(req.user.user_id, 'user_update', user._id, 'User', { status, reason }, req);

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        account_locked: user.account_locked
      }
    });
  } catch (error) {
    console.error('User patch error:', error);
    return sendError(res, 500, 'Failed to update user', 'INTERNAL_ERROR');
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, 'Invalid user id format', 'BAD_REQUEST');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
    }

    await Promise.all([
      AnalysisResult.deleteMany({ user_id: userId }),
      JobApplication.deleteMany({ user_id: userId }),
      Resume.deleteMany({ user_id: userId }),
      SupportTicket.deleteMany({ user_id: userId }),
      Payment.deleteMany({ user_id: userId }),
      User.deleteOne({ _id: userId })
    ]);

    await logAdminAction(req.user.user_id, 'user_delete', userId, 'User', null, req);

    return res.json({ success: true });
  } catch (error) {
    console.error('User delete error:', error);
    return sendError(res, 500, 'Failed to delete user', 'INTERNAL_ERROR');
  }
});

router.post('/users/:userId/adjust-credits', async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const reason = String(req.body?.reason || '').trim();

    if (!Number.isFinite(amount) || amount === 0) {
      return sendError(res, 400, 'Amount required and must be a non-zero number', 'BAD_REQUEST');
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
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
    return sendError(res, 500, 'Failed to adjust credits', 'INTERNAL_ERROR');
  }
});

router.get('/resumes', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const status = String(req.query.status || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim();

    const query = {};
    if (status === 'deleted') {
      query.$or = [{ is_deleted: true }, { status: 'deleted' }];
    } else if (status === 'analyzing') {
      query.status = 'analyzing';
    } else if (status === 'active') {
      query.is_deleted = { $ne: true };
      query.status = { $ne: 'analyzing' };
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { file_name: { $regex: search, $options: 'i' } },
          { version_name: { $regex: search, $options: 'i' } },
          { target_role: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const [resumes, total] = await Promise.all([
      Resume.find(query).sort({ updated_at: -1 }).skip(skip).limit(limit),
      Resume.countDocuments(query)
    ]);

    const userIds = [...new Set(resumes.map((resume) => String(resume.user_id)).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('email name');
    const usersById = Object.fromEntries(users.map((user) => [String(user._id), user]));

    const data = resumes.map((resume) => ({
      ...toResumeDto(resume),
      user: usersById[String(resume.user_id)] || null
    }));

    return sendPaginated(res, {
      extra: {
        success: true,
        resumes: data,
        pagination: {
          total,
          page,
          limit,
          totalItems: total,
          pages: Math.ceil(total / limit)
        }
      },
      data,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Admin resumes list error:', error);
    return sendError(res, 500, 'Failed to fetch resumes', 'INTERNAL_ERROR');
  }
});

router.get('/resumes/:resumeId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      return sendError(res, 404, 'Resume not found', 'NOT_FOUND');
    }

    const [user, analysis] = await Promise.all([
      User.findById(resume.user_id).select('email name'),
      AnalysisResult.findOne({ resume_id: resume._id })
    ]);

    return res.json({
      success: true,
      resume: toResumeDto(resume),
      analysis,
      user
    });
  } catch (error) {
    console.error('Admin resume detail error:', error);
    return sendError(res, 500, 'Failed to fetch resume', 'INTERNAL_ERROR');
  }
});

router.patch('/resumes/:resumeId/notes', async (req, res) => {
  try {
    const notes = String(req.body?.notes || '').trim();
    if (!isValidObjectId(req.params.resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      return sendError(res, 404, 'Resume not found', 'NOT_FOUND');
    }

    resume.admin_notes = notes;
    resume.updated_at = new Date();
    await resume.save();

    await logAdminAction(req.user.user_id, 'resume_note_update', resume._id, 'Resume', { notes }, req);

    return res.json({ success: true, resume: toResumeDto(resume) });
  } catch (error) {
    console.error('Resume notes update error:', error);
    return sendError(res, 500, 'Failed to update resume notes', 'INTERNAL_ERROR');
  }
});

router.delete('/resumes/:resumeId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.resumeId)) {
      return sendError(res, 400, 'Invalid resume id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      return sendError(res, 404, 'Resume not found', 'NOT_FOUND');
    }

    await Resume.deleteOne({ _id: resume._id });
    await AnalysisResult.deleteMany({ resume_id: resume._id });

    await logAdminAction(req.user.user_id, 'resume_delete', resume._id, 'Resume', null, req);

    return res.json({ success: true });
  } catch (error) {
    console.error('Admin resume delete error:', error);
    return sendError(res, 500, 'Failed to delete resume', 'INTERNAL_ERROR');
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const status = String(req.query.status || '').trim();
    const priority = String(req.query.priority || '').trim();

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('user_id', 'email name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(query)
    ]);

    const data = tickets.map((ticket) => ticket.toObject());

    return sendPaginated(res, {
      extra: {
        success: true,
        tickets: data,
        pagination: {
          total,
          page,
          limit,
          totalItems: total,
          pages: Math.ceil(total / limit)
        }
      },
      data,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Tickets list error:', error);
    return sendError(res, 500, 'Failed to fetch tickets', 'INTERNAL_ERROR');
  }
});

router.get('/tickets/:ticketId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.ticketId)) {
      return sendError(res, 400, 'Invalid ticket id format', 'BAD_REQUEST');
    }

    const ticket = await SupportTicket.findById(req.params.ticketId).populate('user_id', 'email name');
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found', 'NOT_FOUND');
    }

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Ticket detail error:', error);
    return sendError(res, 500, 'Failed to fetch ticket', 'INTERNAL_ERROR');
  }
});

router.post('/tickets/:ticketId/reply', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return sendError(res, 422, 'message is required', 'VALIDATION_ERROR');
    }

    if (!isValidObjectId(req.params.ticketId)) {
      return sendError(res, 400, 'Invalid ticket id format', 'BAD_REQUEST');
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found', 'NOT_FOUND');
    }

    ticket.responses.push({
      _id: new mongoose.Types.ObjectId(),
      responder_id: req.user.user_id,
      message,
      created_at: new Date()
    });

    ticket.status = 'in-progress';
    await ticket.save();

    await logAdminAction(req.user.user_id, 'ticket_reply', ticket._id, 'SupportTicket', { message }, req);

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Ticket reply error:', error);
    return sendError(res, 500, 'Failed to reply to ticket', 'INTERNAL_ERROR');
  }
});

router.patch('/tickets/:ticketId', async (req, res) => {
  try {
    const status = req.body?.status;
    const priority = req.body?.priority;

    if (!isValidObjectId(req.params.ticketId)) {
      return sendError(res, 400, 'Invalid ticket id format', 'BAD_REQUEST');
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found', 'NOT_FOUND');
    }

    if (status !== undefined) {
      ticket.status = String(status);
    }

    if (priority !== undefined) {
      ticket.priority = String(priority);
    }

    ticket.updated_at = new Date();
    await ticket.save();

    await logAdminAction(req.user.user_id, 'ticket_update', ticket._id, 'SupportTicket', { status, priority }, req);

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Ticket patch error:', error);
    return sendError(res, 500, 'Failed to update ticket', 'INTERNAL_ERROR');
  }
});

router.post('/tickets/:ticketId/notes', async (req, res) => {
  try {
    const note = String(req.body?.note || '').trim();
    if (!note) {
      return sendError(res, 422, 'note is required', 'VALIDATION_ERROR');
    }

    if (!isValidObjectId(req.params.ticketId)) {
      return sendError(res, 400, 'Invalid ticket id format', 'BAD_REQUEST');
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found', 'NOT_FOUND');
    }

    const existing = String(ticket.resolution_notes || '').trim();
    const timestamped = `[${new Date().toISOString()}] ${note}`;
    ticket.resolution_notes = existing ? `${existing}\n${timestamped}` : timestamped;
    await ticket.save();

    await logAdminAction(req.user.user_id, 'ticket_note', ticket._id, 'SupportTicket', { note }, req);

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Ticket note error:', error);
    return sendError(res, 500, 'Failed to add note', 'INTERNAL_ERROR');
  }
});

router.get('/support/tickets', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const status = String(req.query.status || '').trim();

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('user_id', 'email name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(query)
    ]);

    return res.json({
      success: true,
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalItems: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Support tickets error:', error);
    return sendError(res, 500, 'Failed to fetch tickets', 'INTERNAL_ERROR');
  }
});

router.post('/support/tickets/:ticketId/respond', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return sendError(res, 422, 'message is required', 'VALIDATION_ERROR');
    }

    if (!isValidObjectId(req.params.ticketId)) {
      return sendError(res, 400, 'Invalid ticket id format', 'BAD_REQUEST');
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return sendError(res, 404, 'Ticket not found', 'NOT_FOUND');
    }

    ticket.responses.push({
      _id: new mongoose.Types.ObjectId(),
      responder_id: req.user.user_id,
      message,
      created_at: new Date()
    });
    ticket.status = 'in-progress';
    await ticket.save();

    await logAdminAction(req.user.user_id, 'ticket_reply', ticket._id, 'SupportTicket', { message }, req);

    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Respond ticket error:', error);
    return sendError(res, 500, 'Failed to respond to ticket', 'INTERNAL_ERROR');
  }
});

router.get('/queue', async (req, res) => {
  try {
    const jobs = await Resume.find({
      $or: [{ status: 'analyzing' }, { analysis_error: { $ne: null } }]
    })
      .populate('user_id', 'email name')
      .sort({ updated_at: -1 })
      .limit(200)
      .lean();

    const queue = jobs.map((job) => ({
      id: String(job._id),
      resumeId: String(job._id),
      resumeName: job.file_name || job.version_name || 'Resume',
      ownerId: String(job.user_id?._id || job.user_id || ''),
      ownerName: job.user_id?.name || job.user_id?.email || 'Unknown',
      status: job.status === 'analyzing' ? 'processing' : 'failed',
      createdAt: new Date(job.created_at || Date.now()).toISOString(),
      startedAt: new Date(job.updated_at || job.created_at || Date.now()).toISOString(),
      error: job.analysis_error || null,
      retryCount: 0
    }));

    return res.json({ success: true, queue, jobs: queue });
  } catch (error) {
    console.error('Queue list error:', error);
    return sendError(res, 500, 'Failed to fetch queue', 'INTERNAL_ERROR');
  }
});

router.post('/queue/:jobId/retry', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.jobId)) {
      return sendError(res, 400, 'Invalid job id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findById(req.params.jobId);
    if (!resume) {
      return sendError(res, 404, 'Queue job not found', 'NOT_FOUND');
    }

    resume.status = 'analyzing';
    resume.analysis_error = null;
    resume.updated_at = new Date();
    await resume.save();

    (async () => {
      try {
        const model = getGeminiModel('gemini-pro');
        const prompt = `Analyze this resume for ATS compatibility:\n\n${String(resume.extracted_text || '').trim()}\n\nProvide response ONLY in this JSON format (no markdown, no extra text):\n{\n  "ats_score": <number 1-100>,\n  "score_breakdown": {\n    "format": <number>,\n    "keywords": <number>,\n    "experience": <number>,\n    "education": <number>\n  },\n  "strengths": ["strength1", "strength2", "strength3"],\n  "weaknesses": ["weakness1", "weakness2"],\n  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]\n}`;

        const result = await generateContentWithRetry(model, prompt, {
          maxAttempts: 3,
          baseDelayMs: 800
        });

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        await AnalysisResult.findOneAndUpdate(
          { resume_id: resume._id },
          {
            user_id: resume.user_id,
            resume_id: resume._id,
            ats_score: Number(parsed.ats_score || 0),
            score_breakdown: parsed.score_breakdown,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            confidence: 'high',
            created_at: new Date()
          },
          { upsert: true, setDefaultsOnInsert: true }
        );

        resume.score = Number(parsed.ats_score || 0);
        resume.status = 'active';
        resume.analysis_error = null;
        resume.updated_at = new Date();
        await resume.save();
      } catch (error) {
        console.error('Queue retry background analysis failed:', error);
        resume.status = 'active';
        resume.analysis_error = error.message || 'Analysis retry failed';
        resume.updated_at = new Date();
        await resume.save();
      }
    })();

    await logAdminAction(req.user.user_id, 'queue_retry', resume._id, 'Resume', null, req);

    return res.json({ success: true, job: { id: String(resume._id), status: 'processing' } });
  } catch (error) {
    console.error('Queue retry error:', error);
    return sendError(res, 500, 'Failed to retry queue job', 'INTERNAL_ERROR');
  }
});

router.delete('/queue/:jobId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.jobId)) {
      return sendError(res, 400, 'Invalid job id format', 'BAD_REQUEST');
    }

    const resume = await Resume.findById(req.params.jobId);
    if (!resume) {
      return sendError(res, 404, 'Queue job not found', 'NOT_FOUND');
    }

    resume.status = 'deleted';
    resume.is_deleted = true;
    resume.deleted_at = new Date();
    resume.updated_at = new Date();
    await resume.save();

    await logAdminAction(req.user.user_id, 'queue_cancel', resume._id, 'Resume', null, req);

    return res.json({ success: true });
  } catch (error) {
    console.error('Queue delete error:', error);
    return sendError(res, 500, 'Failed to cancel queue job', 'INTERNAL_ERROR');
  }
});

router.get('/flags', async (req, res) => {
  try {
    const flags = await FeatureFlag.find({}).sort({ name: 1 }).lean();

    return res.json({
      success: true,
      flags: flags.map((flag) => ({
        name: flag.name,
        description: flag.description || '',
        enabled: Boolean(flag.enabled),
        rolloutPercentage: Number(flag.rollout_percentage ?? 100),
        environments: {
          dev: flag.environments?.dev !== false,
          staging: flag.environments?.staging !== false,
          prod: flag.environments?.prod !== false
        }
      }))
    });
  } catch (error) {
    console.error('Admin flags list error:', error);
    return sendError(res, 500, 'Failed to fetch flags', 'INTERNAL_ERROR');
  }
});

router.post('/flags', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().toLowerCase();
    const description = String(req.body?.description || '').trim();

    if (!name) {
      return sendError(res, 422, 'name is required', 'VALIDATION_ERROR');
    }

    const existing = await FeatureFlag.findOne({ name });
    if (existing) {
      return sendError(res, 409, 'Feature flag already exists', 'CONFLICT');
    }

    const flag = new FeatureFlag({
      name,
      description,
      enabled: false,
      rollout_percentage: 100,
      environments: { dev: true, staging: true, prod: true }
    });

    await flag.save();

    await logAdminAction(req.user.user_id, 'flag_create', null, 'FeatureFlag', { name }, req);

    return res.json({
      success: true,
      flag: {
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        rolloutPercentage: flag.rollout_percentage,
        environments: flag.environments
      }
    });
  } catch (error) {
    console.error('Create flag error:', error);
    return sendError(res, 500, 'Failed to create flag', 'INTERNAL_ERROR');
  }
});

router.patch('/flags/:name', async (req, res) => {
  try {
    const name = String(req.params.name || '').trim().toLowerCase();
    const flag = await FeatureFlag.findOne({ name });

    if (!flag) {
      return sendError(res, 404, 'Feature flag not found', 'NOT_FOUND');
    }

    if (req.body?.enabled !== undefined) {
      flag.enabled = Boolean(req.body.enabled);
    }

    if (req.body?.rolloutPercentage !== undefined) {
      const rollout = Number(req.body.rolloutPercentage);
      if (!Number.isFinite(rollout) || rollout < 0 || rollout > 100) {
        return sendError(res, 422, 'rolloutPercentage must be between 0 and 100', 'VALIDATION_ERROR');
      }
      flag.rollout_percentage = rollout;
    }

    if (req.body?.environments && typeof req.body.environments === 'object') {
      flag.environments = {
        dev: req.body.environments.dev !== undefined ? Boolean(req.body.environments.dev) : flag.environments?.dev !== false,
        staging: req.body.environments.staging !== undefined ? Boolean(req.body.environments.staging) : flag.environments?.staging !== false,
        prod: req.body.environments.prod !== undefined ? Boolean(req.body.environments.prod) : flag.environments?.prod !== false
      };
    }

    flag.updated_at = new Date();
    await flag.save();

    await logAdminAction(req.user.user_id, 'flag_update', null, 'FeatureFlag', {
      name,
      enabled: flag.enabled,
      rolloutPercentage: flag.rollout_percentage,
      environments: flag.environments
    }, req);

    return res.json({
      success: true,
      flag: {
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        rolloutPercentage: flag.rollout_percentage,
        environments: flag.environments
      }
    });
  } catch (error) {
    console.error('Flag patch error:', error);
    return sendError(res, 500, 'Failed to update flag', 'INTERNAL_ERROR');
  }
});

router.get('/billing/subscriptions', async (req, res) => {
  try {
    const users = await User.find({}).select('email name subscription created_at').lean();

    const subscriptions = users.map((user) => ({
      id: String(user._id),
      userId: String(user._id),
      userEmail: user.email,
      userName: user.name,
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'trial',
      amount: Number(user.subscription?.amount || 0),
      startedAt: new Date(user.created_at || Date.now()).toISOString(),
      nextBillingAt: user.subscription?.next_billing_at ? new Date(user.subscription.next_billing_at).toISOString() : null
    }));

    const activeCount = subscriptions.filter((s) => s.status === 'active').length;
    const totalMrr = subscriptions.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    return res.json({
      success: true,
      subscriptions,
      stats: {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeCount,
        mrr: totalMrr
      }
    });
  } catch (error) {
    console.error('Billing subscriptions error:', error);
    return sendError(res, 500, 'Failed to fetch subscriptions', 'INTERNAL_ERROR');
  }
});

router.post('/billing/:subId/cancel', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.subId)) {
      return sendError(res, 400, 'Invalid subscription id format', 'BAD_REQUEST');
    }

    const user = await User.findById(req.params.subId);
    if (!user) {
      return sendError(res, 404, 'Subscription not found', 'NOT_FOUND');
    }

    user.subscription = user.subscription || {};
    user.subscription.status = 'cancelled';
    user.subscription.cancelled_at = new Date();
    await user.save();

    await logAdminAction(req.user.user_id, 'subscription_cancel', user._id, 'User', null, req);

    return res.json({ success: true });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    return sendError(res, 500, 'Failed to cancel subscription', 'INTERNAL_ERROR');
  }
});

router.post('/billing/:subId/extend', async (req, res) => {
  try {
    const days = Number(req.body?.days);
    if (!isValidObjectId(req.params.subId)) {
      return sendError(res, 400, 'Invalid subscription id format', 'BAD_REQUEST');
    }

    if (!Number.isFinite(days) || days <= 0) {
      return sendError(res, 422, 'days must be a positive number', 'VALIDATION_ERROR');
    }

    const user = await User.findById(req.params.subId);
    if (!user) {
      return sendError(res, 404, 'Subscription not found', 'NOT_FOUND');
    }

    user.subscription = user.subscription || {};
    const base = user.subscription.next_billing_at ? new Date(user.subscription.next_billing_at) : new Date();
    base.setDate(base.getDate() + days);
    user.subscription.next_billing_at = base;
    user.subscription.status = 'active';
    await user.save();

    await logAdminAction(req.user.user_id, 'subscription_extend', user._id, 'User', { days }, req);

    return res.json({
      success: true,
      nextBillingAt: base.toISOString()
    });
  } catch (error) {
    console.error('Subscription extend error:', error);
    return sendError(res, 500, 'Failed to extend subscription', 'INTERNAL_ERROR');
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const range = String(req.query.range || '30d');
    const dayWindow = range === '7d' ? 7 : range === '90d' ? 90 : range === 'all' ? 3650 : 30;
    const fromDate = new Date(Date.now() - (dayWindow * 24 * 60 * 60 * 1000));

    const [
      users,
      resumes,
      analyses,
      tickets,
      payments
    ] = await Promise.all([
      User.countDocuments({ created_at: { $gte: fromDate } }),
      Resume.countDocuments({ created_at: { $gte: fromDate } }),
      AnalysisResult.countDocuments({ created_at: { $gte: fromDate } }),
      SupportTicket.countDocuments({ created_at: { $gte: fromDate } }),
      Payment.aggregate([
        { $match: { created_at: { $gte: fromDate }, status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return res.json({
      success: true,
      analytics: {
        range,
        users,
        resumes,
        analyses,
        tickets,
        revenue: payments.length > 0 ? Number(payments[0].total || 0) : 0,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return sendError(res, 500, 'Failed to fetch analytics', 'INTERNAL_ERROR');
  }
});

router.post('/audit', async (req, res) => {
  try {
    const adminId = req.body?.adminId;
    const action = String(req.body?.action || '').trim();
    const targetType = String(req.body?.targetType || '').trim();
    const targetId = req.body?.targetId;
    const metadata = req.body?.metadata;

    if (!action) {
      return sendError(res, 422, 'action is required', 'VALIDATION_ERROR');
    }

    const log = new AdminLog({
      _id: new mongoose.Types.ObjectId(),
      admin_id: isValidObjectId(adminId) ? adminId : req.user.user_id,
      action,
      target_id: isValidObjectId(targetId) ? targetId : null,
      target_type: targetType,
      changes: metadata,
      metadata,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    await log.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Audit write error:', error);
    return sendError(res, 500, 'Failed to write audit log', 'INTERNAL_ERROR');
  }
});

router.get('/audit', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 50);
    const skip = (page - 1) * limit;
    const action = String(req.query.action || '').trim();
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const query = {};
    if (action) {
      query.action = action;
    }

    if (from || to) {
      query.created_at = {};
      if (from && !Number.isNaN(from.getTime())) {
        query.created_at.$gte = from;
      }
      if (to && !Number.isNaN(to.getTime())) {
        query.created_at.$lte = to;
      }
    }

    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .populate('admin_id', 'email name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AdminLog.countDocuments(query)
    ]);

    const data = logs.map((log) => ({
      id: String(log._id),
      adminId: String(log.admin_id?._id || log.admin_id || ''),
      adminName: log.admin_id?.name || log.admin_id?.email || 'Unknown',
      action: log.action,
      targetType: log.target_type || '',
      targetId: log.target_id ? String(log.target_id) : '',
      timestamp: new Date(log.created_at || Date.now()).toISOString(),
      metadata: log.metadata || log.changes || null
    }));

    return sendPaginated(res, {
      extra: {
        success: true,
        logs: data,
        items: data,
        pagination: {
          total,
          page,
          limit,
          totalItems: total,
          pages: Math.ceil(total / limit)
        }
      },
      data,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Audit read error:', error);
    return sendError(res, 500, 'Failed to fetch audit logs', 'INTERNAL_ERROR');
  }
});

router.get('/logs', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AdminLog.find({})
        .populate('admin_id', 'email name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AdminLog.countDocuments({})
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalItems: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return sendError(res, 500, 'Failed to fetch admin logs', 'INTERNAL_ERROR');
  }
});

router.get('/payments', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const status = String(req.query.status || 'all');

    const query = status === 'all' ? {} : { status };

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user_id', 'email name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return res.json({
      success: true,
      payments,
      pagination: {
        total,
        page,
        limit,
        totalItems: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Payments list error:', error);
    return sendError(res, 500, 'Failed to fetch payments', 'INTERNAL_ERROR');
  }
});

router.get('/metrics/performance', (req, res) => {
  return res.json({
    success: true,
    metrics: getMetrics(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
