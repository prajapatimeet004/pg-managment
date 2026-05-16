# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\complaints.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.complaint_schemas import ComplaintCreate, ComplaintUpdate, ComplaintStatusPatch, ComplaintResponse
from repositories import ComplaintRepository, TenantRepository
from services.complaint_service import ComplaintService
from routers.websocket import manager

router = APIRouter(prefix="/complaints", tags=["complaints"])

def get_complaint_service(session: Session = Depends(get_session)):
    return ComplaintService(
        ComplaintRepository(session),
        TenantRepository(session)
    )

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    owner_id: Optional[int] = Query(None), 
    property_id: Optional[Any] = Query(None), 
    service: ComplaintService = Depends(get_complaint_service)
):
    return service.get_all(owner_id, property_id)

@router.post("", response_model=ComplaintResponse)
async def create_complaint(
    complaint_in: ComplaintCreate, 
    service: ComplaintService = Depends(get_complaint_service)
):
    result = service.create(complaint_in)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    return result

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int, 
    complaint_in: ComplaintUpdate, 
    owner_id: Optional[int] = Query(None), 
    service: ComplaintService = Depends(get_complaint_service)
):
    result = service.update(complaint_id, complaint_in, owner_id)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    return result

@router.patch("/{complaint_id}/status")
async def patch_complaint_status(
    complaint_id: int, 
    patch: ComplaintStatusPatch, 
    owner_id: Optional[int] = Query(None), 
    service: ComplaintService = Depends(get_complaint_service)
):
    return service.patch_status(complaint_id, patch, owner_id)

@router.delete("/{complaint_id}")
async def delete_complaint(
    complaint_id: int, 
    service: ComplaintService = Depends(get_complaint_service)
):
    result = service.delete(complaint_id)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    return {"message": result}
