from sqlmodel import Session, select
from database import engine
from models import Staff, Property

def fix_staff():
    with Session(engine) as session:
        # Find staff for raku
        staff = session.exec(select(Staff).where(Staff.owner_id == 2)).all()
        # Find properties for raku
        props = session.exec(select(Property).where(Property.owner_id == 2)).all()
        
        if not props:
            print("No properties found for owner 2")
            return
            
        p_id = props[0].id
        p_name = props[0].name
        
        for s in staff:
            if s.role == "Property Manager" or s.role == "Manager":
                s.property_id = p_id
                s.property_ids = str(p_id)
                s.property_name = p_name
                s.property_names = p_name
                session.add(s)
                print(f"Assigned staff {s.name} to property {p_name} (ID: {p_id})")
        
        session.commit()

if __name__ == "__main__":
    fix_staff()
