# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\complaints.py
from fastapi import APIRouter, Depends, Query
from security import get_current_user
from models import Owner
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
    current_user: Owner = Depends(get_current_user), 
    property_id: Optional[Any] = Query(None), 
    service: ComplaintService = Depends(get_complaint_service)
):
    return service.get_all(current_user.id, property_id)

@router.post("", response_model=ComplaintResponse)
async def create_complaint(
    complaint_in: ComplaintCreate, 
    service: ComplaintService = Depends(get_complaint_service)
,
    current_user: Owner = Depends(get_current_user)
):
    complaint_in.owner_id = current_user.id
    result = service.create(complaint_in)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    await manager.broadcast({
        "type": "notification",
        "category": "complaint_created",
        "title": "⚠️ New Complaint Raised",
        "message": f"{result.tenant_name} ({result.property_name}): {result.title}",
        "tenant_id": result.tenant_id,
        "tenant_name": result.tenant_name,
        "property_id": result.property_id,
        "property_name": result.property_name,
        "owner_id": current_user.id,
        "complaint_title": result.title,
        "priority": result.priority
    })
    return result

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int, 
    complaint_in: ComplaintUpdate, 
    current_user: Owner = Depends(get_current_user), 
    service: ComplaintService = Depends(get_complaint_service)
):
    result = service.update(complaint_id, complaint_in, current_user.id)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    await manager.broadcast({
        "type": "notification",
        "category": "complaint_updated",
        "title": "🔧 Complaint Updated",
        "message": f"Complaint '{result.title}' is now {result.status}",
        "tenant_id": result.tenant_id,
        "tenant_name": result.tenant_name,
        "property_id": result.property_id,
        "property_name": result.property_name,
        "owner_id": current_user.id,
        "complaint_title": result.title,
        "status": result.status
    })
    return result

@router.patch("/{complaint_id}/status")
async def patch_complaint_status(
    complaint_id: int, 
    patch: ComplaintStatusPatch, 
    current_user: Owner = Depends(get_current_user), 
    service: ComplaintService = Depends(get_complaint_service)
):
    result_dict = service.patch_status(complaint_id, patch, current_user.id)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    comp = service.repo.get_by_id(complaint_id)
    if comp:
        await manager.broadcast({
            "type": "notification",
            "category": "complaint_updated",
            "title": "🔧 Complaint Updated",
            "message": f"Complaint '{comp.title}' is now {comp.status}",
            "tenant_id": comp.tenant_id,
            "tenant_name": comp.tenant_name,
            "property_id": comp.property_id,
            "property_name": comp.property_name,
            "owner_id": current_user.id,
            "complaint_title": comp.title,
            "status": comp.status
        })
    return result_dict

@router.delete("/{complaint_id}")
async def delete_complaint(
    complaint_id: int, 
    service: ComplaintService = Depends(get_complaint_service)
):
    result = service.delete(complaint_id)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    return {"message": result}
