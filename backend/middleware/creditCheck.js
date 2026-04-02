const User = require('../models/User');

/**
 * Middleware to check if the user has sufficient credits.
 * @param {number} requiredCredits - The number of credits required for the action.
 * @returns {Function} Middleware function.
 */
function checkCredits(requiredCredits) {
  return async (req, res, next) => {
    try {
      if (!req.user?.user_id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.credits < requiredCredits) {
        return res.status(402).json({
          error: 'Insufficient credits',
          message: `This action requires ${requiredCredits} credits. You currently have ${user.credits}.`,
          credits_required: requiredCredits,
          credits_available: user.credits,
          top_up_url: '/payments/top-up'
        });
      }

      // Attach user object to request so we don't have to fetch it again in the route
      req.fullUser = user;
      next();
    } catch (error) {
      console.error('Credit check middleware error:', error);
      res.status(500).json({ error: 'Internal server error during credit validation' });
    }
  };
}

module.exports = { checkCredits };
