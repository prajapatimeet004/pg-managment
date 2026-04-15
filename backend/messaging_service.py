import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Twilio Configuration
ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER") # format: whatsapp:+14155238886
SMS_NUMBER = os.getenv("TWILIO_SMS_NUMBER")

# Initialize Client
client = None
if ACCOUNT_SID and AUTH_TOKEN:
    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        print("✅ Twilio client initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing Twilio client: {str(e)}")
else:
    print("⚠️ Twilio credentials missing from .env. Messaging will be simulated in logs.")

def send_whatsapp(to_number: str, message: str) -> dict:
    """
    Send a WhatsApp message using Twilio.
    to_number: Standard phone number with country code (e.g., +919876543210)
    """
    if not client:
        print(f"[(SIMULATED WHATSAPP)] To: {to_number} | Msg: {message}")
        return {"status": "simulated", "message": message}

    # Ensure to_number is in whatsapp format
    if not to_number.startswith("whatsapp:"):
        formatted_to = f"whatsapp:{to_number}"
    else:
        formatted_to = to_number

    try:
        msg = client.messages.create(
            from_=WHATSAPP_NUMBER,
            body=message,
            to=formatted_to
        )
        return {"status": "success", "sid": msg.sid}
    except Exception as e:
        print(f"❌ Twilio WhatsApp Error: {str(e)}")
        return {"status": "error", "message": str(e)}

def send_sms(to_number: str, message: str) -> dict:
    """
    Send an SMS using Twilio.
    to_number: Standard phone number with country code (e.g., +919876543210)
    """
    if not client:
        print(f"[(SIMULATED SMS)] To: {to_number} | Msg: {message}")
        return {"status": "simulated", "message": message}

    try:
        msg = client.messages.create(
            from_=SMS_NUMBER,
            body=message,
            to=to_number
        )
        return {"status": "success", "sid": msg.sid}
    except Exception as e:
        print(f"❌ Twilio SMS Error: {str(e)}")
        return {"status": "error", "message": str(e)}

def send_dual_reminder(to_number: str, message: str) -> dict:
    """Sends both WhatsApp and SMS for maximum reach"""
    results = {}
    results["whatsapp"] = send_whatsapp(to_number, message)
    results["sms"] = send_sms(to_number, message)
    return results
