# OTP Authentication System

A secure, production-ready OTP-based authentication system built with Node.js, Express, and Supabase.

## Features
- Secure 6-digit numeric OTP generation.
- OTP expiry logic (5 minutes).
- Attempt limiting (max 5 tries).
- Rate limiting (max 3 requests per 10 min).
- JWT generation upon successful verification.
- Automated cleanup of expired OTPs.
- Professional email templates with Nodemailer.

## Prerequisites
1. **Node.js** (v14+)
2. **Supabase Account**: Create a project and get your URL and Anon Key.
3. **SMTP Server**: Use Gmail, SendGrid, or [Ethereal](https://ethereal.email/) for testing.

## Database Setup
Run the following SQL in your Supabase SQL Editor to create the necessary table:

```sql
CREATE TABLE otps (
    email TEXT PRIMARY KEY,
    otp TEXT,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Optional but recommended)
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all
CREATE POLICY "Allow all to service role" ON otps
USING (true) WITH CHECK (true);
```

## Installation
1. Navigate to the `auth-backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Fill in your Supabase, JWT, and SMTP credentials.

## Running the Project
- **Development mode**:
  ```bash
  npm start
  ```
  (Note: I've set up the start script in package.json to run `node index.js`. You can add `nodemon` for auto-reload if preferred).

## API Endpoints

### 1. Send OTP
- **Endpoint**: `POST /api/auth/send-otp`
- **Body**: `{ "email": "user@example.com" }`

### 2. Verify OTP
- **Endpoint**: `POST /api/auth/verify-otp`
- **Body**: `{ "email": "user@example.com", "otp": "123456" }`
- **Response**: Returns a JWT token on success.

### 3. Resend OTP
- **Endpoint**: `POST /api/auth/resend-otp`
- **Body**: `{ "email": "user@example.com" }`

## Security Measures
- **Hashing**: OTPs are hashed using `bcryptjs` before being stored in the database.
- **Rate Limiting**: Limits requests per IP/Email to prevent abuse.
- **Attempt Locking**: Automatically locks verification after 5 failed attempts.
- **Input Validation**: Ensures valid email and OTP formats.
