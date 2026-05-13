from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Checking for password column in staff table...")
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='staff' AND column_name='password'"))
            if not result.fetchone():
                print("Adding password column to staff table...")
                conn.execute(text("ALTER TABLE staff ADD COLUMN password VARCHAR DEFAULT 'password123'"))
                conn.commit()
                print("Migration successful.")
            else:
                print("Password column already exists.")
        except Exception as e:
            print(f"Migration failed or already applied: {e}")

if __name__ == "__main__":
    migrate()
