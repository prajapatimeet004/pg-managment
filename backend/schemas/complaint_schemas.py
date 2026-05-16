# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\complaint_schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComplaintCreate(BaseModel):
    tenant_id: int
    tenant_name: Optional[str] = None
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    category: str
    title: str
    description: str
    status: str
    priority: str
    owner_id: Optional[int] = None

class ComplaintUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class ComplaintStatusPatch(BaseModel):
    status: str

class ComplaintResponse(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    property_id: int
    property_name: str
    category: str
    title: str
    description: str
    status: str
    priority: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    owner_id: Optional[int] = None
