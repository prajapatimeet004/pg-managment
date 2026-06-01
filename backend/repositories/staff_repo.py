# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\staff_repo.py
from sqlmodel import Session, select
from models import Staff
from typing import List, Optional

class StaffRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id=None) -> List[Staff]:
        import re
        query = select(Staff)
        if owner_id:
            query = query.where(Staff.owner_id == owner_id)
        staff_list = list(self.session.exec(query).all())

        # Filter by property_id(s) if provided
        if property_id:
            # Parse requested property ids
            pid_str = str(property_id)
            requested_pids = set(int(i) for i in re.findall(r'\d+', pid_str) if i)
            if requested_pids:
                filtered = []
                for s in staff_list:
                    # Collect all pids this staff member is assigned to
                    s_pids = set()
                    if s.property_ids:
                        s_pids.update(int(i) for i in re.findall(r'\d+', s.property_ids) if i)
                    if s.property_id:
                        s_pids.add(s.property_id)
                    # Include staff if any of their PGs overlap with requested PGs
                    if s_pids & requested_pids:
                        filtered.append(s)
                return filtered
        return staff_list

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
