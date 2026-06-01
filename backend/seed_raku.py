# backend/seed_raku.py
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlmodel import Session, select
from database import engine
from models import Owner
from seed_all_owners import seed_for_owner

def create_and_seed_raku():
    with Session(engine) as session:
        # Check if owner with ID 2 exists
        raku = session.get(Owner, 2)
        if not raku:
            # Check by name 'raku'
            raku = session.exec(select(Owner).where(Owner.name == "raku")).first()
            
        if not raku:
            print("Creating owner 'raku' with ID 2...")
            raku = Owner(
                id=2,
                email="raku@gmail.com",
                password="password123",
                name="raku",
                is_verified=True
            )
            session.add(raku)
            session.commit()
            session.refresh(raku)
        else:
            print(f"Owner 'raku' already exists: ID={raku.id}, Name={raku.name}, Email={raku.email}")
            
        # Seed data for this owner
        seed_for_owner(session, raku)
        print("Data seeded successfully for owner 'raku'!")

if __name__ == "__main__":
    create_and_seed_raku()
