const FeatureUsage = require('../models/FeatureUsage');
const Payment = require('../models/Payment');

const tierCache = new Map();
const TIER_CACHE_TTL_MS = 5 * 60 * 1000;

function startOfHour(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function secondsUntilNextHour(now) {
  return Math.max(1, Math.ceil((startOfHour(new Date(now.getTime() + 60 * 60 * 1000)) - now) / 1000));
}

function secondsUntilNextDay(now) {
  return Math.max(1, Math.ceil((startOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)) - now) / 1000));
}

function resolveTierLimits(limits, tier) {
  if (limits?.free || limits?.paid) {
    const selected = (tier === 'paid' ? limits.paid : limits.free) || limits.free || limits.paid;
    return {
      hourlyLimit: Number(selected?.hourlyLimit || 0),
      dailyLimit: Number(selected?.dailyLimit || 0)
    };
  }

  return {
    hourlyLimit: Number(limits?.hourlyLimit || 0),
    dailyLimit: Number(limits?.dailyLimit || 0)
  };
}

async function resolveUserTier(userId) {
  const key = String(userId);
  const now = Date.now();
  const cached = tierCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.tier;
  }

  const hasSuccessfulPayment = await Payment.exists({ user_id: userId, status: 'success' });
  const tier = hasSuccessfulPayment ? 'paid' : 'free';
  tierCache.set(key, {
    tier,
    expiresAt: now + TIER_CACHE_TTL_MS
  });

  return tier;
}

function createFeatureQuota(feature, limits) {
  const defaults = resolveTierLimits(limits, 'free');
  const hourlyLimit = defaults.hourlyLimit;
  const dailyLimit = defaults.dailyLimit;

  if (!feature || !hourlyLimit || !dailyLimit) {
    throw new Error('Invalid feature quota configuration');
  }

  return async function enforceFeatureQuota(req, res, next) {
    try {
      if (!req.user?.user_id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const now = new Date();
      const currentHourStart = startOfHour(now);
      const currentDayStart = startOfDay(now);
      const tier = await resolveUserTier(req.user.user_id);
      const resolvedLimits = resolveTierLimits(limits, tier);
      const hourlyLimit = resolvedLimits.hourlyLimit;
      const dailyLimit = resolvedLimits.dailyLimit;

      let usage = await FeatureUsage.findOne({
        user_id: req.user.user_id,
        feature
      });

      if (!usage) {
        usage = new FeatureUsage({
          user_id: req.user.user_id,
          feature,
          hour_window_start: currentHourStart,
          hour_count: 0,
          day_window_start: currentDayStart,
          day_count: 0,
          updated_at: now
        });
      }

      if (usage.hour_window_start.getTime() !== currentHourStart.getTime()) {
        usage.hour_window_start = currentHourStart;
        usage.hour_count = 0;
      }

      if (usage.day_window_start.getTime() !== currentDayStart.getTime()) {
        usage.day_window_start = currentDayStart;
        usage.day_count = 0;
      }

      if (usage.hour_count >= hourlyLimit) {
        return res.status(429).json({
          error: 'Hourly feature limit reached',
          feature,
          tier,
          limit_type: 'hourly',
          limit: hourlyLimit,
          upgrade_prompt: tier === 'free' ? 'Upgrade to increase your quota limits.' : undefined,
          retry_after_seconds: secondsUntilNextHour(now)
        });
      }

      if (usage.day_count >= dailyLimit) {
        return res.status(429).json({
          error: 'Daily feature limit reached',
          feature,
          tier,
          limit_type: 'daily',
          limit: dailyLimit,
          upgrade_prompt: tier === 'free' ? 'Upgrade to increase your quota limits.' : undefined,
          retry_after_seconds: secondsUntilNextDay(now)
        });
      }

      usage.hour_count += 1;
      usage.day_count += 1;
      usage.updated_at = now;
      await usage.save();

      req.featureQuota = {
        feature,
        tier,
        hourly: {
          limit: hourlyLimit,
          used: usage.hour_count,
          remaining: Math.max(0, hourlyLimit - usage.hour_count)
        },
        daily: {
          limit: dailyLimit,
          used: usage.day_count,
          remaining: Math.max(0, dailyLimit - usage.day_count)
        }
      };

      next();
    } catch (error) {
      console.error('Feature quota middleware error:', error);
      return res.status(500).json({ error: 'Failed to enforce feature usage limits' });
    }
  };
}

module.exports = { createFeatureQuota };
