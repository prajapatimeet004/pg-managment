from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Migrating property table to add 'images' column...")
        try:
            conn.execute(text("ALTER TABLE property ADD COLUMN images TEXT;"))
            conn.commit()
            print("Successfully added 'images' column to 'property' table.")
        except Exception as e:
            err = str(e).lower()
            if "already exists" in err or "duplicate column" in err:
                print("Column 'images' already exists in 'property'.")
            else:
                print(f"Note on property.images migration: {e}")

if __name__ == "__main__":
    migrate()

