# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\room_repo.py
from sqlmodel import Session, select
from models import Room
from typing import List, Optional, Any

class RoomRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Room]:
        query = select(Room)
        if owner_id:
            query = query.where(Room.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                query = query.where(Room.property_id.in_(pids))
            else:
                query = query.where(Room.property_id == int(property_id))
        return self.session.exec(query).all()

    def get_by_id(self, room_id: int) -> Optional[Room]:
        return self.session.get(Room, room_id)

    def get_by_property_and_room_number(self, property_id: int, room_number: str) -> Optional[Room]:
        return self.session.exec(select(Room).where(Room.property_id == property_id, Room.room_number == room_number)).first()

    def create(self, room: Room) -> Room:
        self.session.add(room)
        self.session.commit()
        self.session.refresh(room)
        return room

    def update(self, room: Room) -> Room:
        self.session.add(room)
        self.session.commit()
        self.session.refresh(room)
        return room
