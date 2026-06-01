# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\property_schemas.py
from pydantic import BaseModel
from typing import Optional, List
from .tenant_schemas import TenantResponse
from .room_schemas import RoomResponse
from .complaint_schemas import ComplaintResponse

class RoomConfig(BaseModel):
    beds: int
    rent_per_bed: float
    has_ac: bool

class FloorConfig(BaseModel):
    rooms: List[RoomConfig]

class PropertyCreate(BaseModel):
    name: str
    address: str
    manager: str
    phone: str
    owner_id: Optional[int] = None
    floors: List[FloorConfig]

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None
    total_rooms: Optional[int] = None
    total_beds: Optional[int] = None
    occupied_beds: Optional[int] = None
    monthly_revenue: Optional[float] = None

class PropertyResponse(BaseModel):
    id: int
    name: str
    address: str
    total_rooms: int
    total_beds: int
    occupied_beds: int
    monthly_revenue: float
    manager: str
    phone: str
    owner_id: Optional[int] = None

class StaffSummary(BaseModel):
    id: int
    name: str
    role: str
    email: str
    phone: str
    status: str
    shift: str

class PropertyDetailResponse(PropertyResponse):
    rooms: List[RoomResponse] = []
    tenants: List[TenantResponse] = []
    complaints: List[ComplaintResponse] = []
    staff: List[StaffSummary] = []
