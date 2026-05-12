const express = require('express');
const authController = require('../controllers/authController');
const { otpRequestLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Routes
router.post('/send-otp', otpRequestLimiter, authController.sendOTP);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOTP);
router.post('/resend-otp', otpRequestLimiter, authController.resendOTP);

module.exports = router;
