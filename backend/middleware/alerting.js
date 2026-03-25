const Sentry = require('@sentry/node');

// Critical error detection
const isCriticalError = (error) => {
  const criticalPatterns = [
    'database connection',
    'payment processing',
    'authentication failure',
    'external service down'
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  return criticalPatterns.some((pattern) => errorMessage.includes(pattern));
};

const alertError = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) {
    console.error('CRITICAL:', error.message, context);
    return;
  }

  const isCritical = isCriticalError(error);

  Sentry.captureException(error, {
    tags: {
      severity: isCritical ? 'critical' : 'warning',
      ...context.tags
    },
    contexts: {
      details: context
    }
  });

  if (isCritical) {
    console.error('CRITICAL ERROR ALERT:', error.message);
    // You can add SMS/Slack alert here
  }
};

module.exports = { alertError, isCriticalError };
