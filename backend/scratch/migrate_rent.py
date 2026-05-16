from sqlmodel import Session, text
from database import engine

def migrate():
    with Session(engine) as session:
        try:
            session.exec(text("ALTER TABLE renttransaction ADD COLUMN property_id INTEGER"))
            session.commit()
            print("Successfully added property_id column to renttransaction")
        except Exception as e:
            print(f"Error or already exists: {e}")
            session.rollback()

if __name__ == "__main__":
    migrate()
