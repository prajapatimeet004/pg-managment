import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# SMTP Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT", "587")
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USERNAME)

def send_email(to_email: str, subject: str, body: str) -> dict:
    """
    Send an email using SMTP.
    If credentials are missing, simulates the process by printing to console.
    """
    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD]):
        print("\n" + "="*50)
        print("[(SIMULATED EMAIL)]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print("="*50 + "\n")
        return {"status": "simulated", "message": "Email printed to console"}

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, int(SMTP_PORT))
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"[OK] Email sent to {to_email}")
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        print(f"[ERROR] Email Error: {str(e)}")
        return {"status": "error", "message": str(e)}

def send_otp_email(to_email: str, otp: str, name: str = "User") -> dict:
    """Convenience function to send OTP email"""
    subject = "Your Verification Code - AI PG Management"
    body = f"""
Hello {name},

Your verification code is: {otp}

This code will expire in 10 minutes. If you did not request this, please ignore this email.

Best regards,
AI PG Management Team
"""
    return send_email(to_email, subject, body)
