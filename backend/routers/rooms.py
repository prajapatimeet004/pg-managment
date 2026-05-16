# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\rooms.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.room_schemas import RoomCreate, RoomUpdate, RoomResponse
from repositories import RoomRepository, PropertyRepository
from services.room_service import RoomService
from routers.websocket import manager

router = APIRouter(prefix="/rooms", tags=["rooms"])

def get_room_service(session: Session = Depends(get_session)):
    return RoomService(
        RoomRepository(session),
        PropertyRepository(session)
    )

@router.get("", response_model=List[RoomResponse])
def get_rooms(
    owner_id: Optional[int] = Query(None), 
    property_id: Optional[Any] = Query(None), 
    service: RoomService = Depends(get_room_service)
):
    return service.get_all(owner_id, property_id)

@router.post("", response_model=RoomResponse)
async def create_room(
    room_in: RoomCreate, 
    service: RoomService = Depends(get_room_service)
):
    result = service.create(room_in)
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    return result

@router.patch("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: int, 
    room_update: RoomUpdate, 
    service: RoomService = Depends(get_room_service)
):
    result = service.update(room_id, room_update)
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    return result
