const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
  },
});

/**
 * Send OTP email to user
 * @param {string} email 
 * @param {string} otp 
 */
const sendOTPEmail = async (email, otp) => {
  const sender = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.SENDER_EMAIL;
  const mailOptions = {
    from: `"Auth Service" <${sender}>`,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Your Verification Code</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Your OTP for login is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">This code will expire in <b>5 minutes</b>.</p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendOTPEmail };
