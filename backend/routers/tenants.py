# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\tenants.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.tenant_schemas import TenantCreate, TenantUpdate, TenantTransfer, TenantResponse
from repositories import TenantRepository, PropertyRepository, RoomRepository
from services.tenant_service import TenantService
from routers.websocket import manager

router = APIRouter(prefix="/tenants", tags=["tenants"])

def get_tenant_service(session: Session = Depends(get_session)):
    return TenantService(
        TenantRepository(session),
        PropertyRepository(session),
        RoomRepository(session)
    )

@router.get("", response_model=List[TenantResponse])
def get_tenants(
    search: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    property_id: Optional[Any] = Query(None),
    service: TenantService = Depends(get_tenant_service)
):
    return service.get_all(search, owner_id, property_id)

@router.post("", response_model=TenantResponse)
async def create_tenant(
    tenant_in: TenantCreate, 
    service: TenantService = Depends(get_tenant_service)
):
    result = service.create(tenant_in)
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    return result

@router.post("/{tenant_id}/transfer", response_model=TenantResponse)
async def transfer_tenant(
    tenant_id: int, 
    request: TenantTransfer, 
    owner_id: Optional[int] = Query(None), 
    service: TenantService = Depends(get_tenant_service)
):
    result = service.transfer(tenant_id, request, owner_id)
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    return result

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int, 
    data: TenantUpdate, 
    owner_id: Optional[int] = Query(None), 
    service: TenantService = Depends(get_tenant_service)
):
    result = service.update(tenant_id, data, owner_id)
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    return result

@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: int, 
    owner_id: Optional[int] = Query(None), 
    service: TenantService = Depends(get_tenant_service)
):
    result = service.delete(tenant_id, owner_id)
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "properties"})
    await manager.broadcast({"type": "data_updated", "entity": "rooms"})
    return {"message": result}
