# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\notice_schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoticeCreate(BaseModel):
    title: str
    content: str
    property_id: int
    property_name: Optional[str] = None
    created_by: str
    urgent: bool = False
    owner_id: Optional[int] = None

class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    property_id: int
    property_name: str
    created_by: str
    created_at: datetime
    urgent: bool
    owner_id: Optional[int] = None
