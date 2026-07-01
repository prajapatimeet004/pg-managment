# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\notice_repo.py
from sqlmodel import Session, select
from models import Notice
from typing import List, Optional, Any

class NoticeRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Notice]:
        query = select(Notice).order_by(Notice.created_at.desc())
        if owner_id:
            query = query.where(Notice.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                if 0 not in pids:
                    pids.append(0)
                query = query.where(Notice.property_id.in_(pids))
            else:
                query = query.where((Notice.property_id == int(property_id)) | (Notice.property_id == 0))
        return self.session.exec(query).all()

    def get_by_id(self, notice_id: int) -> Optional[Notice]:
        return self.session.get(Notice, notice_id)

    def create(self, notice: Notice) -> Notice:
        self.session.add(notice)
        self.session.commit()
        self.session.refresh(notice)
        return notice

    def update(self, notice: Notice) -> Notice:
        self.session.add(notice)
        self.session.commit()
        self.session.refresh(notice)
        return notice

    def delete(self, notice: Notice) -> None:
        self.session.delete(notice)
        self.session.commit()
