const express = require('express');
const crypto = require('crypto');

const FeatureFlag = require('../models/FeatureFlag');

const router = express.Router();

function rolloutEnabledForUser(name, userKey, rolloutPercentage) {
  const hash = crypto.createHash('sha256').update(`${name}:${userKey}`).digest('hex');
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;
  return bucket < Number(rolloutPercentage || 0);
}

router.get('/', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || 'dev').toLowerCase();
    const envKey = env === 'production' ? 'prod' : env === 'staging' ? 'staging' : 'dev';

    const userKey = String(
      req.headers['x-user-id'] ||
      req.headers['x-anonymous-id'] ||
      req.ip ||
      'anonymous'
    );

    const flags = await FeatureFlag.find({ enabled: true }).lean();

    const enabledFlags = {};

    for (const flag of flags) {
      const environments = flag.environments || {};
      if (environments[envKey] === false) {
        enabledFlags[flag.name] = false;
        continue;
      }

      enabledFlags[flag.name] = rolloutEnabledForUser(
        flag.name,
        userKey,
        Number(flag.rollout_percentage ?? 100)
      );
    }

    return res.json({ flags: enabledFlags });
  } catch (error) {
    console.error('Public flags error:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch flags',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
