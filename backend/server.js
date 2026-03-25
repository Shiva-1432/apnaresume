const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initSentry, captureException, isSentryEnabled } = require('./utils/sentry');
const { categorizeError, trackErrorEvent } = require('./utils/errorTracker');
const { alertError } = require('./middleware/alerting');
const { detectThreats } = require('./middleware/threatDetection');
require('dotenv').config();

const app = express();
const monitoring = initSentry();

// Middleware
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    req.requestDurationMs = Date.now() - startedAt;
  });
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

app.use('/api', apiLimiter);
app.use(detectThreats);

function validateSecurityConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('your_super_secret_key')) {
    throw new Error('JWT_SECRET is missing or weak. Set a strong JWT_SECRET (32+ chars) in backend/.env');
  }
}

function registerRoutes() {
  const authRoutes = require('./routes/auth');
  const analysisRoutes = require('./routes/analysis');
  const paymentRoutes = require('./routes/payments');
  const jobMatcherRoutes = require('./routes/jobMatcher');
  const jobApplicationRoutes = require('./routes/jobApplications');
  const skillGapRoutes = require('./routes/skillGap');
  const fresherResumeRoutes = require('./routes/fresherResume');
  const resumeVersionRoutes = require('./routes/resumeVersions');
  const supportRoutes = require('./routes/support');
  const gdprRoutes = require('./routes/gdpr');
  const monitoringRoutes = require('./routes/monitoring');
  const adminRoutes = require('./routes/admin');

  app.use('/api/auth', authRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/job-matching', jobMatcherRoutes);
  app.use('/api/job-applications', jobApplicationRoutes);
  app.use('/api/skill-gap', skillGapRoutes);
  app.use('/api/fresher-resume', fresherResumeRoutes);
  app.use('/api/resume-versions', resumeVersionRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/gdpr', gdprRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      monitoring: isSentryEnabled() ? 'sentry-enabled' : 'sentry-disabled'
    });
  });

  // Sentry test error endpoint
  app.get('/api/error', (req, res) => {
    throw new Error('Sentry test error 🚨');
  });

  app.use(async (error, req, res, next) => {
    const statusCode = Number(error?.status || error?.statusCode || 500);
    const level = categorizeError(error, statusCode);

    captureException(error, {
      level,
      category: 'backend_runtime',
      requestId: req.headers['x-request-id'],
      path: req.path,
      method: req.method,
      statusCode,
      userId: req.user?.user_id,
      sessionId: req.sessionId,
      durationMs: req.requestDurationMs
    });

    await trackErrorEvent({
      source: 'backend',
      level,
      category: 'backend_runtime',
      message: error?.message || 'Server error',
      stack: error?.stack,
      path: req.path,
      method: req.method,
      statusCode,
      userId: req.user?.user_id,
      sessionId: req.sessionId,
      metadata: {
        request_id: req.headers['x-request-id'],
        duration_ms: req.requestDurationMs
      }
    });

    alertError(error, {
      url: req.url,
      method: req.method,
      userId: req.user?.user_id,
      tags: { endpoint: req.path }
    });

    console.error('Server error:', error);
    res.status(500).json({
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  });
}

// Connect to MongoDB with proper error handling
async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log('✓ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB Connection Error:');
    console.error(`   URL: ${process.env.MONGODB_URI?.substring(0, 30)}...`);
    console.error(`   Error: ${error.message}`);

    // Don't continue if DB connection fails.
    process.exit(1);
  }
}

registerRoutes();

async function startServer() {
  validateSecurityConfig();
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV}`);
    console.log(`✓ Monitoring: ${monitoring.enabled ? 'Sentry enabled' : 'Sentry disabled'}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
