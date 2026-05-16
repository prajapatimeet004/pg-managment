from sqlmodel import Session, select
from database import engine
from models import Staff, Property, Owner

def check_data():
    with Session(engine) as session:
        staff = session.exec(select(Staff)).all()
        
        print(f"\n--- ALL Staff ({len(staff)}) ---")
        for s in staff:
            print(f"ID: {s.id}, Name: {s.name}, Role: {s.role}, OwnerID: {s.owner_id}, PropID: {s.property_id}, PropIDs: {s.property_ids}")

if __name__ == "__main__":
    check_data()
