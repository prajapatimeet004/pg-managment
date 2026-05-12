import os
from dotenv import load_dotenv, find_dotenv

print(f"Searching for .env: {find_dotenv()}")
load_dotenv(find_dotenv())

print(f"SMTP_SERVER: {os.getenv('SMTP_SERVER')}")
print(f"SMTP_PORT: {os.getenv('SMTP_PORT')}")
print(f"SMTP_USERNAME: {os.getenv('SMTP_USERNAME')}")
print(f"SMTP_PASSWORD: {'SET' if os.getenv('SMTP_PASSWORD') else 'NOT SET'}")
print(f"SENDER_EMAIL: {os.getenv('SENDER_EMAIL')}")
