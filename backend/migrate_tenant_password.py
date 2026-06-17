from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as connection:
        print("Running migration to add 'password' column to 'tenant' table...")
        try:
            # Attempt to add the column with default value 'password123'
            connection.execute(text("ALTER TABLE tenant ADD COLUMN password VARCHAR DEFAULT 'password123';"))
            connection.commit()
            # Update existing rows to be 'password123' (though DEFAULT should handle it, explicit is safer)
            connection.execute(text("UPDATE tenant SET password = 'password123' WHERE password IS NULL;"))
            connection.commit()
            print("Successfully added 'password' column to 'tenant' table.")
        except Exception as e:
            err_msg = str(e).lower()
            if "already exists" in err_msg or "duplicate column" in err_msg:
                print("Column 'password' already exists. No action needed.")
            else:
                print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
