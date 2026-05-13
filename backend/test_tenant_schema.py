from sqlmodel import Session, select
from database import engine
from models import Tenant

try:
    with Session(engine) as session:
        print("Attempting to fetch tenants...")
        tenants = session.exec(select(Tenant)).all()
        print(f"Successfully fetched {len(tenants)} tenants.")
        for t in tenants:
            print(f"ID: {t.id} | Name: {t.name} | Active: {t.is_active} | Floor: {t.floor}")
except Exception as e:
    print(f"ERROR fetching tenants: {e}")
