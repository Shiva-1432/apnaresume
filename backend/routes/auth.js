const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const legacyAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many legacy auth requests. Please try again later.'
  }
});

router.use(legacyAuthLimiter);

router.all('*', (req, res) => {
  return res.status(410).json({
    error: 'Legacy /api/auth endpoints are removed',
    message: 'Use Clerk sign-in and sign-up flows at /sign-in and /sign-up'
  });
});

module.exports = router;
