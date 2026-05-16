
from sqlmodel import Session, select
from database import engine
from models import Owner
from seed_all_owners import seed_for_owner

def fix_raku():
    with Session(engine) as session:
        # Try finding by name 'raku' or name containing 'raku'
        owner = session.exec(select(Owner).where(Owner.name == "raku")).first()
        if not owner:
            # Fallback check
            owner = session.exec(select(Owner)).first() # Just pick the first one if raku is actually just the current session
            print(f"Raku not found by name, using first owner: {owner.email if owner else 'None'}")
        
        if owner:
            print(f"Seeding data for {owner.name} ({owner.email})...")
            seed_for_owner(session, owner)
            print("Done!")
        else:
            print("No owner found to seed.")

if __name__ == "__main__":
    fix_raku()
