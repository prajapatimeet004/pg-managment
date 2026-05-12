const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const errorHandler = require('./middleware/errorHandler');
const otpModel = require('./models/otpModel');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Clean expired OTPs every hour
setInterval(async () => {
  try {
    console.log('Cleaning expired OTPs...');
    await otpModel.deleteExpired();
  } catch (error) {
    console.error('Error in cron job:', error);
  }
}, 60 * 60 * 1000);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- POST /api/auth/send-otp`);
  console.log(`- POST /api/auth/verify-otp`);
  console.log(`- POST /api/auth/resend-otp`);
});
