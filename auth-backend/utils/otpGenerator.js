const crypto = require('crypto');

/**
 * Generates a secure 6-digit numeric OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generate a random number between 100000 and 999999
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOTP;
