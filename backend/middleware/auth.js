const crypto = require('crypto');
const mongoose = require('mongoose');
const { verifyToken } = require('@clerk/backend');
const User = require('../models/User');

function getClerkSecret() {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret || typeof secret !== 'string' || !secret.startsWith('sk_')) {
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

  const clerkSecret = getClerkSecret();
  if (!clerkSecret) {
    return res.status(500).json({ error: 'Server authentication config missing' });
  }

  try {
    const claims = await verifyToken(token, { secretKey: clerkSecret });
    const clerkUserId = claims?.sub;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Invalid clerk token' });
    }

    let user = await User.findOne({ clerk_user_id: clerkUserId });

    const claimEmail = String(claims?.email || claims?.email_address || '').trim().toLowerCase();
    if (!user && claimEmail) {
      user = await User.findOne({ email: claimEmail });
      if (user && !user.clerk_user_id) {
        user.clerk_user_id = clerkUserId;
        await user.save();
      }
    }

    if (!user) {
      const email = claimEmail || `${clerkUserId}@clerk.local`;
      const name = String(claims?.name || claims?.given_name || email.split('@')[0] || 'User');

      user = new User({
        _id: new mongoose.Types.ObjectId(),
        clerk_user_id: clerkUserId,
        email,
        name,
        password: crypto.randomBytes(16).toString('hex'),
        verification: {
          email_verified: true
        }
      });

      await user.save();
    }

    if (user.account_locked && user.locked_until && user.locked_until > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    req.user = {
      user_id: user._id,
      email: user.email,
      sid: `clerk:${clerkUserId}`,
      auth_provider: 'clerk',
      clerk_user_id: clerkUserId
    };
    req.authClaims = claims;
    req.token = token;
    req.sessionId = req.user.sid;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = {
  authenticateToken,
  extractToken
};
