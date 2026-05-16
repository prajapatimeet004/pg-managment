# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\staff_repo.py
from sqlmodel import Session, select
from models import Staff
from typing import List, Optional

class StaffRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None) -> List[Staff]:
        query = select(Staff)
        if owner_id:
            query = query.where(Staff.owner_id == owner_id)
        return self.session.exec(query).all()

    def get_by_id(self, staff_id: int) -> Optional[Staff]:
        return self.session.get(Staff, staff_id)

    def get_by_email_and_password(self, email: str, password: str) -> Optional[Staff]:
        return self.session.exec(select(Staff).where(Staff.email == email, Staff.password == password)).first()

    def create(self, staff: Staff) -> Staff:
        self.session.add(staff)
        self.session.commit()
        self.session.refresh(staff)
        return staff

    def update(self, staff: Staff) -> Staff:
        self.session.add(staff)
        self.session.commit()
        self.session.refresh(staff)
        return staff

    def delete(self, staff: Staff):
        self.session.delete(staff)
        self.session.commit()
