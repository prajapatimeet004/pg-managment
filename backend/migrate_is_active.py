from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as connection:
        print("Running migration to add 'is_active' column to 'tenant' table...")
        try:
            # Attempt to add the column with default value True
            connection.execute(text("ALTER TABLE tenant ADD COLUMN is_active BOOLEAN DEFAULT TRUE;"))
            connection.commit()
            # Update existing rows to be True (though DEFAULT should handle it, explicit is safer)
            connection.execute(text("UPDATE tenant SET is_active = TRUE WHERE is_active IS NULL;"))
            connection.commit()
            print("Successfully added 'is_active' column to 'tenant' table.")
        except Exception as e:
            err_msg = str(e).lower()
            if "already exists" in err_msg or "duplicate column" in err_msg:
                print("Column 'is_active' already exists. No action needed.")
            else:
                print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
