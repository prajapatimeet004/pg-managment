from sqlmodel import Session, select
from database import engine
from models import Tenant, Room, Property

def fix_double_bookings():
    with Session(engine) as session:
        # Find all active tenants
        tenants = session.exec(select(Tenant).where(Tenant.is_active == True)).all()
        
        # Group by property, room, bed
        bookings = {} # (prop_id, room_num, bed_num) -> [tenants]
        for t in tenants:
            key = (t.property_id, t.room_number, t.bed_number)
            if key not in bookings:
                bookings[key] = []
            bookings[key].append(t)
        
        # Identify duplicates
        for key, assigned_tenants in bookings.items():
            if len(assigned_tenants) > 1:
                prop_id, room_num, bed_num = key
                print(f"Double booking found: Prop {prop_id}, Room {room_num}, Bed {bed_num}")
                
                # Find the room to see available beds
                room = session.exec(
                    select(Room)
                    .where(Room.property_id == prop_id)
                    .where(Room.room_number == room_num)
                ).first()
                
                if not room:
                    continue
                
                # Get all bed letters for this room
                all_beds = [chr(65 + i) for i in range(room.total_beds)]
                # Get currently assigned beds (including the double ones)
                assigned_beds = {t.bed_number for t in tenants if t.property_id == prop_id and t.room_number == room_num}
                # Find truly empty beds
                available_beds = [b for b in all_beds if b not in assigned_beds]
                
                print(f"  Available beds in room: {available_beds}")
                
                # Reassign extra tenants to available beds
                for extra_tenant in assigned_tenants[1:]:
                    if available_beds:
                        new_bed = available_beds.pop(0)
                        print(f"  Moving {extra_tenant.name} from {bed_num} to {new_bed}")
                        extra_tenant.bed_number = new_bed
                        session.add(extra_tenant)
                        # Update assigned_beds set
                        assigned_beds.add(new_bed)
                    else:
                        print(f"  No available beds left for {extra_tenant.name}!")
        
        session.commit()
        print("Fix complete!")

if __name__ == "__main__":
    fix_double_bookings()
