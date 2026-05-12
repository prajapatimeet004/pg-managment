from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as connection:
        print("Running migration to add 'floor' column to 'tenant' table...")
        try:
            # Attempt to add the column
            connection.execute(text("ALTER TABLE tenant ADD COLUMN floor INTEGER;"))
            connection.commit()
            print("Successfully added 'floor' column to 'tenant' table.")
        except Exception as e:
            err_msg = str(e).lower()
            if "already exists" in err_msg or "duplicate column" in err_msg:
                print("Column 'floor' already exists. No action needed.")
            else:
                print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
