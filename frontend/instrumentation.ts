import * as Sentry from '@sentry/nextjs';

function initSentryForRuntime() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1)
  });
}

export async function register() {
  initSentryForRuntime();
}

export const onRequestError = Sentry.captureRequestError;
