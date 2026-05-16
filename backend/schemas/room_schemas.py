# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\room_schemas.py
from pydantic import BaseModel
from typing import Optional

class RoomCreate(BaseModel):
    property_id: int
    property_name: Optional[str] = None
    room_number: str
    floor: int
    total_beds: int
    occupied_beds: int = 0
    rent_per_bed: float
    amenities: str = "WiFi, Attached Bathroom"
    status: str = "available"
    owner_id: Optional[int] = None

class RoomUpdate(BaseModel):
    total_beds: Optional[int] = None
    occupied_beds: Optional[int] = None
    rent_per_bed: Optional[float] = None
    amenities: Optional[str] = None
    status: Optional[str] = None

class RoomResponse(BaseModel):
    id: int
    property_id: int
    property_name: str
    room_number: str
    floor: int
    total_beds: int
    occupied_beds: int
    rent_per_bed: float
    amenities: str
    status: str
    owner_id: Optional[int] = None
