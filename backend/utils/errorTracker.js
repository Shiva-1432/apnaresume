const ErrorEvent = require('../models/ErrorEvent');

function categorizeError(error, statusCode = 500) {
  const message = String(error?.message || '').toLowerCase();

  if (statusCode >= 500 || message.includes('database') || message.includes('payment')) {
    return 'critical';
  }

  if (statusCode >= 400 && statusCode < 500) {
    return 'warning';
  }

  return 'error';
}

async function trackErrorEvent(payload) {
  try {
    if (!payload?.message) {
      return;
    }

    const event = new ErrorEvent({
      source: payload.source || 'backend',
      level: payload.level || 'error',
      category: payload.category || 'general',
      message: String(payload.message).slice(0, 2000),
      stack: payload.stack ? String(payload.stack).slice(0, 10000) : undefined,
      path: payload.path ? String(payload.path).slice(0, 400) : undefined,
      method: payload.method ? String(payload.method).slice(0, 20) : undefined,
      status_code: Number(payload.statusCode || 0) || undefined,
      user_id: payload.userId || undefined,
      session_id: payload.sessionId ? String(payload.sessionId).slice(0, 100) : undefined,
      metadata: payload.metadata || {}
    });

    await event.save();
  } catch (error) {
    console.error('Error tracking save failed:', error.message || error);
  }
}

module.exports = {
  categorizeError,
  trackErrorEvent
};
