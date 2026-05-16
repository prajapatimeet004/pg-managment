# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\rent_schemas.py
from pydantic import BaseModel
from typing import Optional

class RentTransactionCreate(BaseModel):
    tenant_id: int
    tenant_name: Optional[str] = None
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    amount: float
    month: str
    paid_date: str
    payment_mode: str
    receipt_number: str
    owner_id: Optional[int] = None

class RentTransactionResponse(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    property_id: Optional[int] = None
    property_name: str
    amount: float
    month: str
    paid_date: str
    payment_mode: str
    receipt_number: str
    owner_id: Optional[int] = None
