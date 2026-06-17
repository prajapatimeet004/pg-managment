# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\tenant_schemas.py
from pydantic import BaseModel
from typing import Optional

class TenantCreate(BaseModel):
    name: str
    phone: str
    email: str
    password: str
    property_id: int
    property_name: Optional[str] = None
    room_number: str
    floor: Optional[int] = None
    bed_number: str
    rent_amount: float
    rent_due_date: str
    rent_status: str
    join_date: str
    advance: float
    aadhar_number: str
    is_active: bool = True
    owner_id: Optional[int] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    room_number: Optional[str] = None
    floor: Optional[int] = None
    bed_number: Optional[str] = None
    rent_amount: Optional[float] = None
    rent_due_date: Optional[str] = None
    rent_status: Optional[str] = None
    join_date: Optional[str] = None
    advance: Optional[float] = None
    aadhar_number: Optional[str] = None
    is_active: Optional[bool] = None

class TenantTransfer(BaseModel):
    property_id: int
    room_number: str
    bed_number: str

class TenantResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: str
    password: str
    property_id: int
    property_name: str
    room_number: str
    floor: Optional[int] = None
    bed_number: str
    rent_amount: float
    rent_due_date: str
    rent_status: str
    join_date: str
    advance: float
    aadhar_number: str
    is_active: bool
    owner_id: Optional[int] = None
