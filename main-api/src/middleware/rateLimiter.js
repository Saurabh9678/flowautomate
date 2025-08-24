const rateLimit = require('express-rate-limit');
const { TooManyRequestsError } = require('../utils/CustomError');
// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError('Too many requests from this IP, please try again later.');
  }
});


module.exports = {
  generalLimiter
};
