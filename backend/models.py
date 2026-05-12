from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class Owner(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str
    name: str
    otp: Optional[str] = None
    otp_expiry: Optional[datetime] = None
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Property(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: str
    total_rooms: int
    total_beds: int
    occupied_beds: int = 0
    monthly_revenue: float = 0.0
    manager: str
    phone: str
    owner_id: Optional[int] = Field(default=None, index=True)
    
    tenants: List["Tenant"] = Relationship(back_populates="property")
    rooms: List["Room"] = Relationship(back_populates="property")
    complaints: List["Complaint"] = Relationship(back_populates="property")

# ── Per-room configuration (not a table, used in PropertyCreate) ────────────
class RoomConfig(SQLModel):
    """Configuration for a single room."""
    beds: int
    rent_per_bed: float
    has_ac: bool

class FloorConfig(SQLModel):
    """Configuration for a single floor: a list of room configs."""
    rooms: List[RoomConfig]

class PropertyCreate(SQLModel):
    """Create a property with detailed per-floor, per-room configuration."""
    name: str
    address: str
    manager: str
    phone: str
    owner_id: Optional[int] = None
    floors: List[FloorConfig]  # One FloorConfig per floor

class Tenant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: str
    email: str
    property_id: int = Field(foreign_key="property.id")
    property_name: str
    room_number: str
    floor: Optional[int] = None
    bed_number: str
    rent_amount: float
    rent_due_date: str
    rent_status: str # "paid", "due", "overdue"
    join_date: str
    advance: float
    aadhar_number: str
    is_active: bool = Field(default=True)
    owner_id: Optional[int] = Field(default=None, index=True)
    
    property: Optional[Property] = Relationship(back_populates="tenants")

class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="property.id")
    property_name: str
    room_number: str
    floor: int
    total_beds: int
    occupied_beds: int = 0
    rent_per_bed: float
    amenities: str = "WiFi, Attached Bathroom"
    status: str = "available"
    owner_id: Optional[int] = Field(default=None, index=True)
    
    property: Optional[Property] = Relationship(back_populates="rooms")

class Complaint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int
    tenant_name: str
    property_id: int = Field(foreign_key="property.id")
    property_name: str
    category: str
    title: str
    description: str
    status: str # "open", "in-progress", "resolved", "closed"
    priority: str # "low", "medium", "high"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    owner_id: Optional[int] = Field(default=None, index=True)
    
    property: Optional[Property] = Relationship(back_populates="complaints")

class Notice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    property_id: int
    property_name: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    urgent: bool = False
    owner_id: Optional[int] = Field(default=None, index=True)

class RentTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int
    tenant_name: str
    property_name: str
    amount: float
    month: str
    paid_date: str
    payment_mode: str
    receipt_number: str
    owner_id: Optional[int] = Field(default=None, index=True)

class Staff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    role: str # "Admin", "Manager", "Housekeeping", "Security"
    email: str
    phone: str
    property_id: Optional[int] = Field(default=None, foreign_key="property.id")
    property_name: Optional[str] = None
    status: str = "Active" # "Active", "On Leave", "Terminated"
    shift: str = "Day" # "Day", "Night"
    join_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    owner_id: Optional[int] = Field(default=None, index=True)
