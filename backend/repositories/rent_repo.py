# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\rent_repo.py
from sqlmodel import Session, select
from models import RentTransaction
from typing import List, Optional, Any

class RentRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[RentTransaction]:
        query = select(RentTransaction).order_by(RentTransaction.paid_date.desc())
        if owner_id:
            query = query.where(RentTransaction.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                query = query.where(RentTransaction.property_id.in_(pids))
            else:
                query = query.where(RentTransaction.property_id == int(property_id))
        return self.session.exec(query).all()

    def get_by_tenant(self, tenant_id: int) -> List[RentTransaction]:
        return self.session.exec(select(RentTransaction).where(RentTransaction.tenant_id == tenant_id).order_by(RentTransaction.paid_date.desc())).all()

    def create(self, transaction: RentTransaction) -> RentTransaction:
        self.session.add(transaction)
        self.session.commit()
        self.session.refresh(transaction)
        return transaction
