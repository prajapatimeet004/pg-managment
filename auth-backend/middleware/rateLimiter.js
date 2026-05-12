const rateLimit = require('express-rate-limit');

// Limit OTP requests: max 3 requests per 10 minutes per email/IP
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 requests per window
  message: {
    status: 'error',
    message: 'Too many OTP requests, please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use email as key if provided in request body
  keyGenerator: (req) => req.body.email || req.ip,
});

// Limit OTP verification attempts: max 10 attempts per 5 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    status: 'error',
    message: 'Too many verification attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpRequestLimiter, otpVerifyLimiter };
