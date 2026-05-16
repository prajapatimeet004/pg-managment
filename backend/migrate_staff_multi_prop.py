from sqlmodel import Session, text
from database import engine

def migrate():
    with Session(engine) as session:
        print("Starting migration...")
        try:
            # Add property_ids column
            session.exec(text("ALTER TABLE staff ADD COLUMN property_ids VARCHAR"))
            print("Added property_ids column.")
        except Exception as e:
            print(f"property_ids column might already exist or error: {e}")
            session.rollback()

        try:
            # Add property_names column
            session.exec(text("ALTER TABLE staff ADD COLUMN property_names VARCHAR"))
            print("Added property_names column.")
        except Exception as e:
            print(f"property_names column might already exist or error: {e}")
            session.rollback()

        # Update existing data: set property_ids to property_id and property_names to property_name
        try:
            session.exec(text("UPDATE staff SET property_ids = CAST(property_id AS VARCHAR) WHERE property_id IS NOT NULL AND property_ids IS NULL"))
            session.exec(text("UPDATE staff SET property_names = property_name WHERE property_name IS NOT NULL AND property_names IS NULL"))
            print("Synchronized existing data.")
        except Exception as e:
            print(f"Error synchronizing data: {e}")
            session.rollback()

        session.commit()
        print("Migration completed.")

if __name__ == "__main__":
    migrate()
