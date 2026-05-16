from sqlmodel import Session, select, text
from database import engine
from models import Staff

with Session(engine) as session:
    print("\n--- STAFF COLUMNS ---")
    try:
        # Check if we can query the new columns
        result = session.exec(text("SELECT property_ids, property_names FROM staff LIMIT 1"))
        print("Columns property_ids and property_names exist.")
    except Exception as e:
        print(f"Error: {e}")
        print("It seems the database schema is outdated. Columns property_ids or property_names are missing.")

    print("\n--- STAFF DATA ---")
    try:
        staff = session.exec(select(Staff)).all()
        for s in staff:
            print(f"ID: {s.id} | Name: {s.name} | Property IDs: {getattr(s, 'property_ids', 'N/A')} | Property Names: {getattr(s, 'property_names', 'N/A')}")
    except Exception as e:
        print(f"Error fetching staff: {e}")
