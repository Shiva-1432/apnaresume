const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.includes('your_super_secret_key')) {
    return null;
  }

  return secret;
}

function extractToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

async function authenticateToken(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Server authentication config missing' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded.user_id || !decoded.sid) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const user = await User.findById(decoded.user_id).select('sessions account_locked locked_until');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.account_locked && user.locked_until && user.locked_until > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    const session = user.sessions.find((s) => s.session_id === decoded.sid && s.is_active);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }

    session.last_activity_at = new Date();
    await user.save();

    req.user = decoded;
    req.token = token;
    req.sessionId = decoded.sid;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = {
  authenticateToken,
  extractToken,
  getJwtSecret
};
