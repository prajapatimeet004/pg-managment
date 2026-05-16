# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\properties.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.property_schemas import PropertyResponse, PropertyDetailResponse, PropertyCreate, PropertyUpdate
from repositories import PropertyRepository, RoomRepository, TenantRepository, ComplaintRepository, NoticeRepository, StaffRepository, RentRepository
from services.property_service import PropertyService
from routers.websocket import manager

router = APIRouter(prefix="/properties", tags=["properties"])

def get_property_service(session: Session = Depends(get_session)):
    return PropertyService(
        PropertyRepository(session),
        RoomRepository(session),
        TenantRepository(session),
        ComplaintRepository(session),
        NoticeRepository(session),
        StaffRepository(session),
        RentRepository(session)
    )

@router.get("", response_model=List[PropertyResponse])
def get_properties(
    owner_id: Optional[int] = Query(None), 
    property_id: Optional[Any] = Query(None), 
    service: PropertyService = Depends(get_property_service)
):
    return service.get_all(owner_id, property_id)

@router.post("", response_model=PropertyResponse)
async def create_property(
    prop_in: PropertyCreate, 
    service: PropertyService = Depends(get_property_service)
):
    result = service.create(prop_in)
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    return result

@router.get("/{property_id}", response_model=PropertyDetailResponse)
def get_property(
    property_id: int, 
    owner_id: Optional[int] = Query(None), 
    service: PropertyService = Depends(get_property_service)
):
    return service.get_by_id(property_id, owner_id)

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int, 
    prop_in: PropertyUpdate, 
    owner_id: Optional[int] = Query(None), 
    service: PropertyService = Depends(get_property_service)
):
    result = service.update(property_id, prop_in, owner_id)
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    return result

@router.delete("/{property_id}")
async def delete_property(
    property_id: int, 
    owner_id: Optional[int] = Query(None), 
    service: PropertyService = Depends(get_property_service)
):
    result = service.delete(property_id, owner_id)
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    await manager.broadcast({"type": "data_updated", "entity": "notices"})
    return {"message": result}
