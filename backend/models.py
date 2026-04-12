from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

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
    
    tenants: List["Tenant"] = Relationship(back_populates="property")
    rooms: List["Room"] = Relationship(back_populates="property")
    complaints: List["Complaint"] = Relationship(back_populates="property")

class Tenant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: str
    email: str
    property_id: int = Field(foreign_key="property.id")
    property_name: str
    room_number: str
    bed_number: str
    rent_amount: float
    rent_due_date: str
    rent_status: str # "paid", "due", "overdue"
    join_date: str
    advance: float
    aadhar_number: str
    
    property: Optional[Property] = Relationship(back_populates="tenants")

class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="property.id")
    property_name: str
    room_number: str
    floor: int
    total_beds: int
    occupied_beds: int
    rent_per_bed: float
    amenities: str # JSON string or comma separated
    status: str # "available", "partial", "full"
    
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
