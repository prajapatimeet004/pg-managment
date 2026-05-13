from sqlmodel import Session, select
from database import engine
from models import Owner, Property, Tenant, Room

with Session(engine) as session:
    print("\n--- PROPERTIES (detailed) ---")
    props = session.exec(select(Property)).all()
    for p in props:
        print(f"ID: {p.id} | Name: {p.name} | Owner ID: {p.owner_id} | Total Beds: {p.total_beds} | Occ Beds: {p.occupied_beds} | Revenue: {p.monthly_revenue}")

    print("\n--- TENANTS (detailed) ---")
    tenants = session.exec(select(Tenant)).all()
    for t in tenants:
        print(f"ID: {t.id} | Name: {t.name} | Owner ID: {t.owner_id} | Rent Status: {t.rent_status} | Active: {t.is_active}")
