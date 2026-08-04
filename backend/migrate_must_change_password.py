from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        for table in ("tenant", "staff"):
            print(f"Checking for must_change_password column in {table} table...")
            try:
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    f"WHERE table_name='{table}' AND column_name='must_change_password'"
                ))
                if not result.fetchone():
                    print(f"Adding must_change_password column to {table} table...")
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE"
                    ))
                    # Existing accounts keep their current passwords — do not force a change.
                    conn.execute(text(
                        f"UPDATE {table} SET must_change_password = FALSE WHERE must_change_password IS NULL OR must_change_password = TRUE"
                    ))
                    conn.commit()
                    print("Migration successful.")
                else:
                    conn.execute(text(
                        f"UPDATE {table} SET must_change_password = FALSE WHERE must_change_password IS NULL"
                    ))
                    conn.commit()
                    print("must_change_password column already exists.")
            except Exception as e:
                print(f"Migration failed or already applied: {e}")

if __name__ == "__main__":
    migrate()
