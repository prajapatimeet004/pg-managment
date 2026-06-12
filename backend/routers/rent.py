# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\rent.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.rent_schemas import RentTransactionCreate, RentTransactionResponse
from repositories import RentRepository, TenantRepository
from services.rent_service import RentService
from routers.websocket import manager

router = APIRouter(prefix="/rent-collection", tags=["rent"])

def get_rent_service(session: Session = Depends(get_session)):
    return RentService(
        RentRepository(session),
        TenantRepository(session)
    )

@router.get("", response_model=List[RentTransactionResponse])
def get_rent_collection(
    owner_id: Optional[int] = Query(None), 
    property_id: Optional[Any] = Query(None), 
    service: RentService = Depends(get_rent_service)
):
    return service.get_all(owner_id, property_id)

@router.post("", response_model=RentTransactionResponse)
async def create_rent_transaction(
    transaction_in: RentTransactionCreate, 
    service: RentService = Depends(get_rent_service)
):
    result = service.create(transaction_in)
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "rent"})
    await manager.broadcast({
        "type": "notification",
        "category": "rent_paid",
        "title": "Rent Payment Received 💰",
        "message": f"{result.tenant_name} paid ₹{int(result.amount):,} for {result.month}",
        "tenant_id": result.tenant_id,
        "tenant_name": result.tenant_name,
        "property_id": result.property_id,
        "property_name": result.property_name,
        "owner_id": result.owner_id,
        "amount": result.amount,
        "month": result.month,
        "receipt_number": result.receipt_number
    })
    return result

