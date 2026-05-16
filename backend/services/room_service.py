# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\room_service.py
from fastapi import HTTPException
from models import Room
from schemas.room_schemas import RoomCreate, RoomUpdate
from repositories import RoomRepository, PropertyRepository
from typing import List, Optional, Any

class RoomService:
    def __init__(self, repo: RoomRepository, property_repo: PropertyRepository):
        self.repo = repo
        self.property_repo = property_repo

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Room]:
        return self.repo.get_all(owner_id, property_id)

    def create(self, room_in: RoomCreate) -> Room:
        room = Room(**room_in.dict())
        prop = self.property_repo.get_by_id(room.property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        
        if not room.property_name:
            room.property_name = prop.name
        
        # Update Property Stats
        prop.total_rooms += 1
        prop.total_beds += room.total_beds
        self.property_repo.update(prop)
        
        return self.repo.create(room)

    def update(self, room_id: int, room_update: RoomUpdate) -> Room:
        room = self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        old_total_beds = room.total_beds
        update_data = room_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(room, key, value)
        
        if "total_beds" in update_data:
            new_total_beds = update_data["total_beds"]
            if new_total_beds < room.occupied_beds:
                 raise HTTPException(status_code=400, detail="Cannot reduce total beds below current occupancy")
            
            prop = self.property_repo.get_by_id(room.property_id)
            if prop:
                prop.total_beds = prop.total_beds - old_total_beds + new_total_beds
                self.property_repo.update(prop)

        return self.repo.update(room)
