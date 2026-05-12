const otpModel = require('../models/otpModel');
const generateOTP = require('../utils/otpGenerator');
const { sendOTPEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;

const authController = {
  /**
   * Send OTP to user email
   */
  sendOTP: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ status: 'error', message: 'Email is required' });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString();

      await otpModel.upsertOTP(email, otp, expiresAt);
      await sendOTPEmail(email, otp);

      res.status(200).json({
        status: 'success',
        message: 'OTP sent successfully to your email'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify OTP and return JWT
   */
  verifyOTP: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
      }

      const record = await otpModel.getOTP(email);

      if (!record) {
        return res.status(404).json({ status: 'error', message: 'No OTP requested for this email' });
      }

      // Check expiry
      if (new Date(record.expiresAt) < new Date()) {
        return res.status(400).json({ status: 'error', message: 'OTP has expired' });
      }

      // Check attempts
      if (record.attempts >= MAX_ATTEMPTS) {
        return res.status(400).json({ status: 'error', message: 'Maximum attempts reached. Please request a new OTP.' });
      }

      // Verify OTP
      const isValid = await bcrypt.compare(otp, record.otp);

      if (!isValid) {
        await otpModel.incrementAttempts(email, record.attempts);
        return res.status(400).json({ 
          status: 'error', 
          message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts - 1} attempts remaining.` 
        });
      }

      // Valid OTP
      await otpModel.markAsVerified(email);

      // Generate JWT
      const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );

      res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully',
        token,
        user: { email }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Resend OTP
   */
  resendOTP: async (req, res, next) => {
    // Simply reuse sendOTP logic
    return authController.sendOTP(req, res, next);
  }
};

module.exports = authController;
