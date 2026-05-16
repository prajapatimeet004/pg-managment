
from pydantic import BaseModel, field_validator
from typing import Optional, List
import re

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

# Test data similar to what's coming from the database
test_data = {
    "id": 1,
    "name": "John Doe",
    "role": "Manager",
    "email": "john@example.com",
    "phone": "1234567890",
    "property_id": 9,
    "property_ids": "9,10",
    "property_name": "Comfort Stay - raku",
    "property_names": "Comfort Stay - raku, Luxury Stay",
    "status": "Active",
    "shift": "Day",
    "join_date": "2023-01-01",
    "owner_id": 5
}

try:
    resp = StaffResponse(**test_data)
    print("Success!")
    print(f"property_ids: {resp.property_ids} (Type: {type(resp.property_ids)})")
    print(f"property_names: {resp.property_names} (Type: {type(resp.property_names)})")
except Exception as e:
    print(f"Error: {e}")
