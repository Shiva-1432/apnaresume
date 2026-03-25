const express = require('express');
const rateLimit = require('express-rate-limit');
const ErrorEvent = require('../models/ErrorEvent');
const { captureException } = require('../utils/sentry');
const { categorizeError, trackErrorEvent } = require('../utils/errorTracker');

const router = express.Router();

const frontendErrorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many error reports. Please try again later.' }
});

function canViewMonitoring(req) {
  const key = process.env.MONITORING_ADMIN_KEY;
  if (!key) {
    return process.env.NODE_ENV !== 'production';
  }

  const incoming = req.headers['x-monitoring-key'];
  return incoming && String(incoming) === key;
}

router.post('/frontend-error', frontendErrorLimiter, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    const category = String(req.body?.category || 'frontend').trim();
    const level = String(req.body?.level || 'warning').trim();

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    await trackErrorEvent({
      source: 'frontend',
      level,
      category,
      message,
      stack: req.body?.stack,
      path: req.body?.path,
      method: req.body?.method,
      statusCode: req.body?.status_code,
      userId: req.body?.user_id,
      sessionId: req.body?.session_id,
      metadata: {
        user_agent: req.headers['user-agent'],
        payload: req.body?.metadata || {}
      }
    });

    if (level === 'critical' || level === 'error') {
      captureException(new Error(message), {
        level,
        category,
        path: req.body?.path,
        method: req.body?.method,
        userId: req.body?.user_id,
        sessionId: req.body?.session_id
      });
    }

    return res.status(202).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to report frontend error' });
  }
});

router.get('/test-error', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    const error = new Error('Monitoring test error');
    await trackErrorEvent({
      source: 'backend',
      level: 'critical',
      category: 'test',
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      metadata: { test: true }
    });

    captureException(error, {
      level: 'critical',
      category: 'test',
      path: req.path,
      method: req.method
    });

    return res.status(200).json({ success: true, message: 'Test error captured' });
  } catch {
    return res.status(500).json({ error: 'Test error failed' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    if (!canViewMonitoring(req)) {
      return res.status(403).json({ error: 'Unauthorized for monitoring analytics' });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      total24h,
      critical24h,
      warning24h,
      backend24h,
      frontend24h,
      topCategories,
      recent
    ] = await Promise.all([
      ErrorEvent.countDocuments({ created_at: { $gte: since } }),
      ErrorEvent.countDocuments({ created_at: { $gte: since }, level: 'critical' }),
      ErrorEvent.countDocuments({ created_at: { $gte: since }, level: 'warning' }),
      ErrorEvent.countDocuments({ created_at: { $gte: since }, source: 'backend' }),
      ErrorEvent.countDocuments({ created_at: { $gte: since }, source: 'frontend' }),
      ErrorEvent.aggregate([
        { $match: { created_at: { $gte: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      ErrorEvent.find({ created_at: { $gte: since } })
        .sort({ created_at: -1 })
        .limit(20)
        .select('source level category message path method status_code created_at')
    ]);

    return res.json({
      success: true,
      window: '24h',
      totals: {
        total: total24h,
        critical: critical24h,
        warning: warning24h,
        backend: backend24h,
        frontend: frontend24h
      },
      top_categories: topCategories,
      recent
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch monitoring analytics' });
  }
});

module.exports = router;
