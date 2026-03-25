const rateLimit = require('express-rate-limit');

const ddosProtection = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  skip: (req) => {
    // Skip health checks
    return req.path === '/api/health';
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

module.exports = { ddosProtection };
