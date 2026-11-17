from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Migrating identity document columns for tenant and staff...")
        
        # Tenant table columns
        tenant_cols = [
            ("photo", "TEXT"),
            ("aadhar_card_front", "TEXT"),
            ("aadhar_card_back", "TEXT"),
        ]
        for col_name, col_type in tenant_cols:
            try:
                conn.execute(text(f"ALTER TABLE tenant ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"Added column '{col_name}' to 'tenant' table.")
            except Exception as e:
                err = str(e).lower()
                if "already exists" in err or "duplicate column" in err:
                    print(f"Column '{col_name}' already exists in 'tenant'.")
                else:
                    print(f"Note on tenant.{col_name}: {e}")

        # Staff table columns
        staff_cols = [
            ("aadhar_number", "TEXT"),
            ("photo", "TEXT"),
            ("aadhar_card_front", "TEXT"),
            ("aadhar_card_back", "TEXT"),
        ]
        for col_name, col_type in staff_cols:
            try:
                conn.execute(text(f"ALTER TABLE staff ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"Added column '{col_name}' to 'staff' table.")
            except Exception as e:
                err = str(e).lower()
                if "already exists" in err or "duplicate column" in err:
                    print(f"Column '{col_name}' already exists in 'staff'.")
                else:
                    print(f"Note on staff.{col_name}: {e}")

        print("Migration complete!")

if __name__ == "__main__":
    migrate()

