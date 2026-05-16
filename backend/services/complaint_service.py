# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\complaint_service.py
from fastapi import HTTPException
from datetime import datetime
from models import Complaint
from schemas.complaint_schemas import ComplaintCreate, ComplaintUpdate, ComplaintStatusPatch
from repositories import ComplaintRepository, TenantRepository
from typing import List, Optional

class ComplaintService:
    def __init__(self, repo: ComplaintRepository, tenant_repo: TenantRepository):
        self.repo = repo
        self.tenant_repo = tenant_repo

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[int] = None) -> List[Complaint]:
        return self.repo.get_all(owner_id, property_id)

    def create(self, complaint_in: ComplaintCreate) -> Complaint:
        complaint = Complaint(**complaint_in.dict())
        
        # Auto-resolve tenant info if only tenant_id given
        if complaint.tenant_id and (not complaint.tenant_name or not complaint.property_name):
            tenant = self.tenant_repo.get_by_id(complaint.tenant_id)
            if tenant:
                if not complaint.tenant_name:
                    complaint.tenant_name = tenant.name
                if not complaint.property_id:
                    complaint.property_id = tenant.property_id
                if not complaint.property_name:
                    complaint.property_name = tenant.property_name
                if not complaint.owner_id:
                    complaint.owner_id = tenant.owner_id
                    
        return self.repo.create(complaint)

    def update(self, complaint_id: int, complaint_in: ComplaintUpdate, owner_id: Optional[int] = None) -> Complaint:
        complaint = self.repo.get_by_id(complaint_id)
        if not complaint or (owner_id and complaint.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Complaint not found")
            
        update_data = complaint_in.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(complaint, key, value)
            
        if update_data.get("status") in ("resolved", "closed"):
            complaint.resolved_at = datetime.utcnow()
            
        return self.repo.update(complaint)

    def patch_status(self, complaint_id: int, patch: ComplaintStatusPatch, owner_id: Optional[int] = None) -> dict:
        complaint = self.repo.get_by_id(complaint_id)
        if not complaint or (owner_id and complaint.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Complaint not found")
            
        if patch.status not in ("open", "in-progress", "resolved", "closed"):
            raise HTTPException(status_code=400, detail="Invalid status")
            
        complaint.status = patch.status
        if patch.status in ("resolved", "closed"):
            complaint.resolved_at = datetime.utcnow()
            
        self.repo.update(complaint)
        return {"id": complaint_id, "status": patch.status, "message": "Status updated"}

    def delete(self, complaint_id: int) -> str:
        complaint = self.repo.get_by_id(complaint_id)
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        self.repo.delete(complaint)
        return "Complaint deleted successfully"
