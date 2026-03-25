const { body, validationResult } = require('express-validator');

const validateResumeUpload = [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().trim().isLength({ max: 100 })
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.param,
        message: e.msg
      }))
    });
  }

  next();
};

module.exports = {
  validateResumeUpload,
  handleValidationErrors
};
