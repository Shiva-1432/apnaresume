const Sentry = require('@sentry/node');

let sentryEnabled = false;

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return { enabled: false };
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1)
  });

  sentryEnabled = true;
  return { enabled: true };
}

function captureException(error, context = {}) {
  if (!sentryEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.level) {
      scope.setLevel(String(context.level));
    }
    if (context.requestId) {
      scope.setTag('request_id', String(context.requestId));
    }
    if (context.path) {
      scope.setTag('path', String(context.path));
    }
    if (context.method) {
      scope.setTag('method', String(context.method));
    }
    if (context.category) {
      scope.setTag('category', String(context.category));
    }
    if (context.statusCode) {
      scope.setTag('status_code', String(context.statusCode));
    }
    if (context.durationMs) {
      scope.setTag('duration_ms', String(context.durationMs));
    }
    if (context.userId) {
      scope.setUser({ id: String(context.userId) });
    }
    if (context.sessionId) {
      scope.setTag('session_id', String(context.sessionId));
    }

    Sentry.captureException(error);
  });
}

function isSentryEnabled() {
  return sentryEnabled;
}

module.exports = {
  initSentry,
  captureException,
  isSentryEnabled
};
