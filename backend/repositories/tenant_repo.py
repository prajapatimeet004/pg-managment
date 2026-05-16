# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\tenant_repo.py
from sqlmodel import Session, select
from models import Tenant
from typing import List, Optional, Any

class TenantRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Tenant]:
        query = select(Tenant)
        if owner_id:
            query = query.where(Tenant.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                query = query.where(Tenant.property_id.in_(pids))
            else:
                query = query.where(Tenant.property_id == int(property_id))
        return self.session.exec(query).all()

    def get_active(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Tenant]:
        query = select(Tenant).where(Tenant.is_active == True)
        if owner_id:
            query = query.where(Tenant.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                query = query.where(Tenant.property_id.in_(pids))
            else:
                query = query.where(Tenant.property_id == int(property_id))
        return self.session.exec(query).all()

    def get_by_id(self, tenant_id: int) -> Optional[Tenant]:
        return self.session.get(Tenant, tenant_id)

    def get_by_email_and_phone(self, email: str, phone: str) -> Optional[Tenant]:
        return self.session.exec(select(Tenant).where(Tenant.email == email, Tenant.phone == phone)).first()

    def create(self, tenant: Tenant) -> Tenant:
        self.session.add(tenant)
        self.session.commit()
        self.session.refresh(tenant)
        return tenant

    def get_by_bed(self, property_id: int, room_number: str, bed_number: str) -> Optional[Tenant]:
        return self.session.exec(
            select(Tenant)
            .where(Tenant.property_id == property_id)
            .where(Tenant.room_number == room_number)
            .where(Tenant.bed_number == bed_number)
            .where(Tenant.is_active == True)
        ).first()

    def update(self, tenant: Tenant) -> Tenant:
        self.session.add(tenant)
        self.session.commit()
        self.session.refresh(tenant)
        return tenant
