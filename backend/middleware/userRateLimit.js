function createUserRateLimit(options = {}) {
  const windowMs = Number(options.windowMs || 60 * 1000);
  const max = Number(options.max || 30);
  const message = options.message || 'Too many requests. Please try again shortly.';
  const keyGenerator = options.keyGenerator || ((req) => req.user?.user_id?.toString() || req.ip);
  const bucket = new Map();

  function cleanup(now) {
    if (bucket.size < 5000) {
      return;
    }

    for (const [key, value] of bucket.entries()) {
      if (!value || value.resetAt <= now) {
        bucket.delete(key);
      }
    }
  }

  return function userRateLimit(req, res, next) {
    const now = Date.now();
    cleanup(now);

    const key = String(keyGenerator(req) || req.ip || 'anonymous');
    const existing = bucket.get(key);

    if (!existing || existing.resetAt <= now) {
      bucket.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (existing.count >= max) {
      return res.status(429).json({
        error: message,
        retry_after_seconds: Math.ceil((existing.resetAt - now) / 1000)
      });
    }

    existing.count += 1;
    bucket.set(key, existing);
    return next();
  };
}

module.exports = {
  createUserRateLimit
};
