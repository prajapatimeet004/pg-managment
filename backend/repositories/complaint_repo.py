# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\complaint_repo.py
from sqlmodel import Session, select
from models import Complaint
from typing import List, Optional, Any

class ComplaintRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Complaint]:
        query = select(Complaint).order_by(Complaint.created_at.desc())
        if owner_id:
            query = query.where(Complaint.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                query = query.where(Complaint.property_id.in_(pids))
            else:
                query = query.where(Complaint.property_id == int(property_id))
        return self.session.exec(query).all()

    def get_by_tenant(self, tenant_id: int) -> List[Complaint]:
        return self.session.exec(select(Complaint).where(Complaint.tenant_id == tenant_id).order_by(Complaint.created_at.desc())).all()

    def get_by_id(self, complaint_id: int) -> Optional[Complaint]:
        return self.session.get(Complaint, complaint_id)

    def create(self, complaint: Complaint) -> Complaint:
        self.session.add(complaint)
        self.session.commit()
        self.session.refresh(complaint)
        return complaint

    def update(self, complaint: Complaint) -> Complaint:
        self.session.add(complaint)
        self.session.commit()
        self.session.refresh(complaint)
        return complaint

    def delete(self, complaint: Complaint):
        self.session.delete(complaint)
        self.session.commit()
