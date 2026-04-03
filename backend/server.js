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

// ✅ Harden security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.apnaresume.com", "https://sentry.io"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '1mb' }));

// ✅ Locked CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://apnaresume.com',
  'https://www.apnaresume.com'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request timing
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    req.requestDurationMs = Date.now() - startedAt;
  });
  next();
});

// ✅ Rate limiter with standard headers
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  skip: (req) => req.path === '/api/health'
});

app.use('/api', apiLimiter);
app.use(detectThreats);

// ✅ Routes
function registerRoutes(app) {
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
  const userRoutes = require('./routes/users');
  const flagsRoutes = require('./routes/flags');
  const historyRoutes = require('./routes/history');

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
  app.use('/api/users', userRoutes);
  app.use('/api/flags', flagsRoutes);
  app.use('/api/history', historyRoutes);

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

registerRoutes(app);

// ✅ Error handler (must be registered after all routes)
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

// ✅ MongoDB connection
async function connectDB() {
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping DB connection in test');
    return;
  }
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

// ✅ Start server
async function startServer() {

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  connectDB().then(startServer);
}

module.exports = app;