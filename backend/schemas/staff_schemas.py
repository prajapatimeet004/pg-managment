# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\staff_schemas.py
from pydantic import BaseModel, field_validator
from typing import Optional, List

class StaffCreate(BaseModel):
    name: str
    role: str
    email: str
    password: str = "password123"
    phone: str
    property_id: Optional[int] = None
    property_ids: Optional[List[int]] = None
    property_name: Optional[str] = None
    property_names: Optional[List[str]] = None
    status: str = "Active"
    shift: str = "Day"
    join_date: Optional[str] = None
    owner_id: Optional[int] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    property_id: Optional[int] = None
    property_ids: Optional[List[int]] = None
    property_name: Optional[str] = None
    property_names: Optional[List[str]] = None
    status: Optional[str] = None
    shift: Optional[str] = None
    join_date: Optional[str] = None

class StaffResponse(BaseModel):
    id: int
    name: str
    role: str
    email: str
    phone: str
    property_id: Optional[int] = None
    property_ids: Optional[List[int]] = None
    property_name: Optional[str] = None
    property_names: Optional[List[str]] = None
    status: str
    shift: str
    join_date: str
    owner_id: Optional[int] = None

    @field_validator("property_ids", mode="before")
    @classmethod
    def parse_property_ids(cls, v):
        if isinstance(v, str) and v:
            import re
            return [int(i) for i in re.findall(r"\d+", v) if i]
        return v

    @field_validator("property_names", mode="before")
    @classmethod
    def parse_property_names(cls, v):
        if isinstance(v, str) and v:
            return [n.strip() for n in v.split(",") if n.strip()]
        return v
