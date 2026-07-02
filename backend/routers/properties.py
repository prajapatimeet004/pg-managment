# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\properties.py
from fastapi import APIRouter, Depends, Query, HTTPException, Request, status
from security import get_current_user, SECRET_KEY, ALGORITHM
from models import Owner
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.property_schemas import PropertyResponse, PropertyDetailResponse, PropertyCreate, PropertyUpdate
from repositories import PropertyRepository, RoomRepository, TenantRepository, ComplaintRepository, NoticeRepository, StaffRepository, RentRepository
from services.property_service import PropertyService
from routers.websocket import manager
from jose import jwt, JWTError

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

def require_owner_role(request: Request):
    """Raise 403 if the authenticated user is not an Owner (e.g. a manager)."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role", "")
        if role != "Owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only property owners can create new properties."
            )
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.get("", response_model=List[PropertyResponse])
def get_properties(
    current_user: Owner = Depends(get_current_user), 
    property_id: Optional[Any] = Query(None), 
    service: PropertyService = Depends(get_property_service)
):
    return service.get_all(current_user.id, property_id)

@router.post("", response_model=PropertyResponse)
async def create_property(
    request: Request,
    prop_in: PropertyCreate,
    service: PropertyService = Depends(get_property_service),
    current_user: Owner = Depends(get_current_user)
):
    require_owner_role(request)
    prop_in.owner_id = current_user.id
    result = service.create(prop_in)
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    return result

@router.get("/{property_id}", response_model=PropertyDetailResponse)
def get_property(
    property_id: int, 
    current_user: Owner = Depends(get_current_user), 
    service: PropertyService = Depends(get_property_service)
):
    return service.get_by_id(property_id, current_user.id)

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int, 
    prop_in: PropertyUpdate, 
    current_user: Owner = Depends(get_current_user), 
    service: PropertyService = Depends(get_property_service)
):
    result = service.update(property_id, prop_in, current_user.id)
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    return result

@router.delete("/{property_id}")
async def delete_property(
    property_id: int, 
    current_user: Owner = Depends(get_current_user), 
    service: PropertyService = Depends(get_property_service)
):
    result = service.delete(property_id, current_user.id)
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    await manager.broadcast({"type": "data_updated", "entity": "notices"})
    return {"message": result}
