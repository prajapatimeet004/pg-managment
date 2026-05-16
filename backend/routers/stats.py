# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\stats.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from database import get_session
from typing import Optional, Any
from repositories import PropertyRepository, TenantRepository, ComplaintRepository, StaffRepository
from services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["stats"])

def get_stats_service(session: Session = Depends(get_session)):
    return StatsService(
        PropertyRepository(session),
        TenantRepository(session),
        ComplaintRepository(session),
        StaffRepository(session)
    )

@router.get("")
def get_stats(
    owner_id: Optional[int] = Query(None), 
    property_id: Optional[Any] = Query(None), 
    service: StatsService = Depends(get_stats_service)
):
    return service.get_stats(owner_id, property_id)
