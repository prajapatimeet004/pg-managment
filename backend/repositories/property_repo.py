# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\property_repo.py
from sqlmodel import Session, select
from models import Property
from typing import List, Optional, Any

class PropertyRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Property]:
        query = select(Property)
        if owner_id:
            query = query.where(Property.owner_id == owner_id)
        if property_id:
            if isinstance(property_id, str) and "," in property_id:
                pids = [int(i) for i in property_id.split(",") if i]
                query = query.where(Property.id.in_(pids))
            else:
                query = query.where(Property.id == int(property_id))
        return self.session.exec(query).all()

    def get_by_id(self, property_id: int) -> Optional[Property]:
        return self.session.get(Property, property_id)

    def create(self, property: Property) -> Property:
        self.session.add(property)
        self.session.commit()
        self.session.refresh(property)
        return property

    def update(self, property: Property) -> Property:
        self.session.add(property)
        self.session.commit()
        self.session.refresh(property)
        return property

    def delete(self, property: Property):
        self.session.delete(property)
        self.session.commit()
