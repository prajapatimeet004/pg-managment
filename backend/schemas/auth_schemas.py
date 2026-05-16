# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\auth_schemas.py
from pydantic import BaseModel
from typing import Optional

class OwnerSignup(BaseModel):
    email: str
    password: str
    name: str

class OwnerLogin(BaseModel):
    email: str
    password: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class TenantLogin(BaseModel):
    email: str
    phone: str
