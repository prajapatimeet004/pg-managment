# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\seed_all_owners.py
from sqlmodel import Session, select
from database import engine
from models import Owner, Property, Tenant, Room, Staff, Complaint, Notice, RentTransaction
import random
import uuid
from datetime import datetime, timedelta

def generate_unique_email(base):
    return f"{base}_{uuid.uuid4().hex[:4]}@pgpro.com"

def seed_for_owner(session, owner):
    try:
        # Check if owner already has significant data
        existing_prop = session.exec(select(Property).where(Property.owner_id == owner.id)).first()
        
        print(f"Seeding comprehensive data for Owner: {owner.email}...")
        
        # 1. Properties (Create 2 properties for more variety)
        pg_types = ["Elite", "Royal", "Urban", "Comfort", "Green"]
        for p_idx in range(2):
            prop_name = f"{random.choice(pg_types)} Living {p_idx+1} - {owner.name.split()[0]}"
            
            # Check if this property name already exists for this owner
            if session.exec(select(Property).where(Property.name == prop_name, Property.owner_id == owner.id)).first():
                continue

            prop = Property(
                name=prop_name,
                address=f"Phase {p_idx+1}, Road {random.randint(10, 50)}, Whitefield, Bangalore",
                total_rooms=10,
                total_beds=30,
                occupied_beds=8,
                monthly_revenue=64000.0,
                manager=f"Manager {p_idx+1}",
                phone=f"+91 90000 000{p_idx}{owner.id}",
                owner_id=owner.id
            )
            session.add(prop)
            session.commit()
            session.refresh(prop)

            # 2. Rooms (10 rooms per property)
            for r_idx in range(1, 11):
                floor = (r_idx - 1) // 4 + 1
                room_status = random.choice(["available", "full", "partial", "maintenance"])
                occ = 3 if room_status == "full" else (random.randint(1, 2) if room_status == "partial" else 0)
                
                room = Room(
                    property_id=prop.id,
                    property_name=prop.name,
                    room_number=f"{floor}0{r_idx}",
                    floor=floor,
                    total_beds=3,
                    occupied_beds=occ,
                    rent_per_bed=8000 + (r_idx * 100),
                    amenities="AC, WiFi, Attached Bathroom" if r_idx % 2 == 0 else "WiFi, Common Bathroom",
                    status=room_status,
                    owner_id=owner.id
                )
                session.add(room)

            # 3. Tenants (8 per property)
            t_names = ["Rahul", "Priya", "Arjun", "Sita", "Karan", "Nisha", "Amit", "Sneha", "Vikram", "Pooja"]
            for t_idx in range(8):
                t_name = f"{random.choice(t_names)} {random.choice(['Kumar', 'Singh', 'Sharma', 'Reddy'])}"
                status = random.choice(["paid", "due", "overdue"])
                
                tenant = Tenant(
                    name=t_name,
                    phone=f"+91 98765 {random.randint(10000, 99999)}",
                    email=generate_unique_email(f"tenant_{owner.id}_{p_idx}_{t_idx}"),
                    property_id=prop.id,
                    property_name=prop.name,
                    room_number=f"10{random.randint(1, 4)}",
                    bed_number=random.choice(["A", "B", "C"]),
                    rent_amount=8000.0,
                    rent_due_date=(datetime.now() + timedelta(days=random.randint(-5, 10))).strftime("%Y-%m-%d"),
                    rent_status=status,
                    join_date="2025-12-01",
                    advance=16000.0,
                    aadhar_number=f"{random.randint(1000, 9999)} 8888 7777",
                    owner_id=owner.id
                )
                session.add(tenant)
                session.commit()
                session.refresh(tenant)

                # 4. Transactions (2 per tenant)
                for tx_idx in range(2):
                    tx = RentTransaction(
                        tenant_id=tenant.id,
                        tenant_name=tenant.name,
                        property_name=prop.name,
                        amount=8000.0,
                        month=f"{(datetime.now() - timedelta(days=30*tx_idx)).strftime('%B %Y')}",
                        paid_date=(datetime.now() - timedelta(days=random.randint(1, 40))).strftime("%Y-%m-%d"),
                        payment_mode=random.choice(["UPI", "Cash", "Bank Transfer"]),
                        receipt_number=f"REC-{owner.id}{prop.id}{tenant.id}{tx_idx}",
                        owner_id=owner.id
                    )
                    session.add(tx)

            # 5. Complaints (3 per property)
            cats = ["Plumbing", "Electrical", "WiFi", "Cleaning"]
            for c_idx in range(3):
                comp = Complaint(
                    tenant_id=random.randint(1, 100), # Simple ref
                    tenant_name=f"User {c_idx}",
                    property_id=prop.id,
                    property_name=prop.name,
                    category=random.choice(cats),
                    title=f"Issue with {random.choice(cats)}",
                    description="Please fix this as soon as possible. It is causing inconvenience.",
                    status=random.choice(["open", "in-progress", "resolved"]),
                    priority=random.choice(["low", "medium", "high"]),
                    owner_id=owner.id
                )
                session.add(comp)

            # 6. Notices (2 per property)
            notices = [
                Notice(title="Water Shortage", content="Tank cleaning on Sunday.", property_id=prop.id, property_name=prop.name, created_by="Admin", urgent=True, owner_id=owner.id),
                Notice(title="New Rules", content="Quiet hours start at 10 PM.", property_id=prop.id, property_name=prop.name, created_by="Manager", owner_id=owner.id)
            ]
            session.add_all(notices)

        # 7. Staff (3 per owner)
        staff_roles = ["Property Manager", "Care Taker", "Security Head"]
        for s_idx in range(3):
            s = Staff(
                name=f"Staff Member {s_idx+1}",
                role=staff_roles[s_idx],
                email=generate_unique_email(f"staff_{owner.id}_{s_idx}"),
                phone=f"+91 70000 66{s_idx}{owner.id}",
                status="Active",
                shift="Day" if s_idx < 2 else "Night",
                owner_id=owner.id
            )
            session.add(s)

        session.commit()
        print(f"Successfully Mega-Seeded Owner {owner.id}")
    except Exception as e:
        session.rollback()
        print(f"Failed to seed Owner {owner.id}: {str(e)}")

def main():
    with Session(engine) as session:
        owners = session.exec(select(Owner)).all()
        for owner in owners:
            # We seed for everyone again to fill missing details, but rely on Property name uniqueness or just let it add more
            seed_for_owner(session, owner)

if __name__ == "__main__":
    main()
