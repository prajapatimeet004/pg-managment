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
    service: TenantService = Depends(get_tenant_service),
    session: Session = Depends(get_session)
):
    # Get old rent_status before update
    old_tenant = TenantRepository(session).get_by_id(tenant_id)
    old_status = old_tenant.rent_status if old_tenant else None
    old_name = old_tenant.name if old_tenant else ""

    result = service.update(tenant_id, data, owner_id)
    new_status = result.rent_status

    # Broadcast notification if rent_status changed
    if old_status and old_status != new_status:
        if new_status == "paid":
            cat, title = "rent_paid", "Rent Payment Received 💰"
            msg = f"{old_name} paid rent for {result.property_name}"
        elif new_status == "overdue":
            cat, title = "rent_overdue", "🚨 Rent Overdue"
            msg = f"{old_name}'s rent is now overdue at {result.property_name}"
        else:
            cat, title = "rent_due", "📋 Rent Due"
            msg = f"{old_name}'s rent is now due at {result.property_name}"

        await manager.broadcast({
            "type": "notification",
            "category": cat,
            "title": title,
            "message": msg,
            "tenant_id": tenant_id,
            "tenant_name": result.name,
            "property_name": result.property_name,
            "property_id": result.property_id,
            "owner_id": result.owner_id,
        })

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
