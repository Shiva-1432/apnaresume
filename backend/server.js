const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const { initSentry, captureException, isSentryEnabled } = require('./utils/sentry');
const { categorizeError, trackErrorEvent } = require('./utils/errorTracker');
const { alertError } = require('./middleware/alerting');
const { detectThreats } = require('./middleware/threatDetection');

dotenv.config();

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

// Request timing
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    req.requestDurationMs = Date.now() - startedAt;
  });
  next();
});

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

app.use('/api', apiLimiter);
app.use(detectThreats);

// ✅ Routes
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
      database: isDbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      monitoring: isSentryEnabled() ? 'enabled' : 'disabled'
    });
  });
}

// ✅ MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('MongoDB Error:', error.message);
    process.exit(1);
  }
}

// ✅ Error handler
app.use(async (error, req, res, next) => {
  const statusCode = Number(error?.status || 500);
  const level = categorizeError(error, statusCode);

  captureException(error);

  await trackErrorEvent({
    source: 'backend',
    level,
    message: error.message
  });

  alertError(error);

  console.error(error);

  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
  });
});

// ✅ Start server
async function startServer() {
  await connectDB();
  registerRoutes();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

startServer();