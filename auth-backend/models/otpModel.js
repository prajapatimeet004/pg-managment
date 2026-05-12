const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const OTP_TABLE = 'otps';

const otpModel = {
  /**
   * Save or update OTP for an email
   */
  upsertOTP: async (email, otp, expiresAt) => {
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    const { data, error } = await supabase
      .from(OTP_TABLE)
      .upsert({
        email,
        otp: hashedOtp,
        expiresAt,
        attempts: 0,
        verified: false
      }, { onConflict: 'email' });

    if (error) throw error;
    return data;
  },

  /**
   * Get OTP record by email
   */
  getOTP: async (email) => {
    const { data, error } = await supabase
      .from(OTP_TABLE)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
    return data;
  },

  /**
   * Increment attempts for an email
   */
  incrementAttempts: async (email, currentAttempts) => {
    const { error } = await supabase
      .from(OTP_TABLE)
      .update({ attempts: currentAttempts + 1 })
      .eq('email', email);

    if (error) throw error;
  },

  /**
   * Mark OTP as verified and clear the OTP
   */
  markAsVerified: async (email) => {
    const { error } = await supabase
      .from(OTP_TABLE)
      .update({ 
        verified: true, 
        otp: null, 
        attempts: 0 
      })
      .eq('email', email);

    if (error) throw error;
  },

  /**
   * Delete expired OTPs
   */
  deleteExpired: async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(OTP_TABLE)
      .delete()
      .lt('expiresAt', now);

    if (error) throw error;
  }
};

module.exports = otpModel;
