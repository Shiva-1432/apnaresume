const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateToken, getJwtSecret } = require('../middleware/auth');
const { sendEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const router = express.Router();

const AUTH_MAX_FAILED_ATTEMPTS = 5;
const AUTH_LOCKOUT_MINUTES = 15;
const MAX_CONCURRENT_SESSIONS = 3;
const VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 60;

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  const value = String(password || '');
  return value.length >= 8
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value);
}

function clientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip;
}

function clientUserAgent(req) {
  return String(req.headers['user-agent'] || '').slice(0, 255);
}

function createRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function createSession(user, req) {
  const sessionId = crypto.randomUUID();
  const now = new Date();

  user.sessions = (user.sessions || []).filter((session) => session.is_active);
  user.sessions.push({
    session_id: sessionId,
    created_at: now,
    last_activity_at: now,
    ip: clientIp(req),
    user_agent: clientUserAgent(req),
    is_active: true
  });

  if (user.sessions.length > MAX_CONCURRENT_SESSIONS) {
    user.sessions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    user.sessions = user.sessions.slice(user.sessions.length - MAX_CONCURRENT_SESSIONS);
  }

  return sessionId;
}

function ensureDatabaseReady(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      error: 'Database not connected. Set a valid MONGODB_URI in backend/.env and restart backend.'
    });
    return false;
  }

  return true;
}

async function applyEmailVerification(email, token, res) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !token) {
    res.status(400).json({ error: 'email and token are required' });
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  if (!ensureDatabaseReady(res)) {
    return;
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const tokenHash = hashToken(token);
  const sentAt = user.verification?.verification_sent_at;
  const storedHash = user.verification?.verification_token;

  if (!storedHash || storedHash !== tokenHash) {
    res.status(400).json({ error: 'Invalid verification token' });
    return;
  }

  if (!sentAt || (Date.now() - new Date(sentAt).getTime()) > VERIFICATION_TTL_HOURS * 60 * 60 * 1000) {
    res.status(400).json({ error: 'Verification token expired' });
    return;
  }

  user.verification.email_verified = true;
  user.verification.verification_token = null;
  user.verification.verification_sent_at = null;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully' });
}

// REGISTER endpoint
router.post('/register', registerLimiter, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const { email, password, name } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = String(name || '').trim();
    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server authentication config missing' });
    }

    // Validate input
    if (!normalizedEmail || !password || !trimmedName) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      return res.status(400).json({ error: 'Name must be between 2 and 80 characters' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be 8+ chars and include uppercase, lowercase, and number'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const emailVerificationToken = createRawToken();
    const user = new User({
      _id: new (require('mongoose')).Types.ObjectId(),
      email: normalizedEmail,
      password,
      name: trimmedName,
      credits: 20, // Free tier
      verification: {
        email_verified: false,
        verification_token: hashToken(emailVerificationToken),
        verification_sent_at: new Date()
      }
    });

    await user.save();

    const sessionId = createSession(user, req);
    await user.save();

    try {
      await sendEmail('verifyEmail', {
        email: user.email,
        token: emailVerificationToken,
        userName: user.name
      });
    } catch (error) {
      console.error('Email service down, but user created');
    }

    // Return token
    const token = jwt.sign(
      { user_id: user._id, email: user.email, sid: sessionId },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits
      },
      email_verification_required: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN endpoint
router.post('/login', loginLimiter, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server authentication config missing' });
    }

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.account_locked && user.locked_until && user.locked_until > new Date()) {
      return res.status(423).json({
        error: `Account locked due to failed attempts. Try again in ${AUTH_LOCKOUT_MINUTES} minutes.`
      });
    }

    if (user.locked_until && user.locked_until <= new Date()) {
      user.account_locked = false;
      user.locked_until = null;
      user.failed_login_attempts = 0;
    }

    // Verify password
    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

      if (user.failed_login_attempts >= AUTH_MAX_FAILED_ATTEMPTS) {
        user.account_locked = true;
        user.locked_until = new Date(Date.now() + AUTH_LOCKOUT_MINUTES * 60 * 1000);
      }

      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login and create active session
    user.failed_login_attempts = 0;
    user.account_locked = false;
    user.locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = clientIp(req);
    const sessionId = createSession(user, req);
    await user.save();

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email: user.email, sid: sessionId },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


// LOGOUT endpoint (revoke current session)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const user = await User.findById(req.user.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    for (const session of user.sessions || []) {
      if (session.session_id === req.sessionId) {
        session.is_active = false;
      }
    }

    await user.save();

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// LOGOUT ALL endpoint (revoke all sessions)
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const user = await User.findById(req.user.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    user.sessions = [];
    if (user.session_tokens) user.session_tokens = [];
    await user.save();

    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// VERIFY EMAIL endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;
    await applyEmailVerification(email, token, res);
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
});

// VERIFY EMAIL compatibility endpoint (query params)
router.get('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.query;
    await applyEmailVerification(email, token, res);
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
});

// RESEND VERIFICATION EMAIL endpoint
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!ensureDatabaseReady(res)) {
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user && !user.verification?.email_verified) {
      const emailVerificationToken = createRawToken();
      user.verification.verification_token = hashToken(emailVerificationToken);
      user.verification.verification_sent_at = new Date();
      await user.save();

      try {
        await sendVerificationEmail(user.email, emailVerificationToken);
      } catch (error) {
        console.error('Verification email dispatch failed:', error.message || error);
      }
    }

    return res.json({
      success: true,
      message: 'If your account is unverified, a verification email has been sent.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// FORGOT PASSWORD endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!ensureDatabaseReady(res)) {
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const rawToken = createRawToken();
      user.password_reset = {
        reset_token: hashToken(rawToken),
        reset_sent_at: new Date()
      };
      await user.save();

      try {
        await sendEmail('passwordReset', {
          email: user.email,
          userName: user.name,
          resetToken: rawToken
        });
      } catch (error) {
        console.error('Password reset email dispatch failed:', error.message || error);
      }
    }

    return res.json({
      success: true,
      message: 'If your email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// RESET PASSWORD endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const token = req.body?.token;
    const email = req.body?.email;
    const newPassword = req.body?.new_password || req.body?.password;
    const normalizedEmail = normalizeEmail(email);

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token and password are required' });
    }

    if (email && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be 8+ chars and include uppercase, lowercase, and number'
      });
    }

    if (!ensureDatabaseReady(res)) {
      return;
    }

    const incomingHash = hashToken(token);
    const cutoffDate = new Date(Date.now() - PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    const resetQuery = {
      'password_reset.reset_token': incomingHash,
      'password_reset.reset_sent_at': { $gte: cutoffDate }
    };

    if (email) {
      resetQuery.email = normalizedEmail;
    }

    const user = await User.findOne(resetQuery);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.password_reset = {
      reset_token: null,
      reset_sent_at: null
    };
    for (const session of user.sessions || []) {
      session.is_active = false;
    }
    await user.save();

    return res.json({ success: true, message: 'Password reset successful. Please login again.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// LOGOUT ALL endpoint (revoke all sessions)
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    await User.updateOne(
      { _id: req.user.user_id },
      { $set: { 'sessions.$[].is_active': false } }
    );

    return res.json({ success: true, message: 'All sessions logged out' });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ error: 'Logout all failed' });
  }
});

module.exports = router;
