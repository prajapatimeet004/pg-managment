# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\repositories\auth_repo.py
from sqlmodel import Session, select
from models import Owner
from typing import Optional

class AuthRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_owner_by_email(self, email: str) -> Optional[Owner]:
        return self.session.exec(select(Owner).where(Owner.email == email)).first()

    def get_owner_by_email_and_password(self, email: str, password: str) -> Optional[Owner]:
        return self.session.exec(select(Owner).where(Owner.email == email, Owner.password == password)).first()

    def create_owner(self, owner: Owner) -> Owner:
        self.session.add(owner)
        self.session.commit()
        self.session.refresh(owner)
        return owner

    def update_owner(self, owner: Owner) -> Owner:
        self.session.add(owner)
        self.session.commit()
        self.session.refresh(owner)
        return owner
