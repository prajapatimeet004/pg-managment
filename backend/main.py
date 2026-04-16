from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, delete
from typing import List, Optional
from database import engine, create_db_and_tables, get_session
from models import Property, PropertyCreate, RoomConfig, FloorConfig, Tenant, Room, Complaint, Notice, RentTransaction, Staff
from ai_service import get_ai_insight, process_chat, process_ai_agent
from messaging_service import send_dual_reminder, send_whatsapp, send_sms
from datetime import datetime

from pydantic import BaseModel

app = FastAPI(title="AI PG Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API is running"}

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_data()

def seed_data():
    with Session(engine) as session:
        if session.exec(select(Property)).first():
            return

        properties = [
            Property(name="Sunshine PG - Koramangala", address="5th Block, Koramangala, Bangalore - 560095", total_rooms=12, total_beds=36, occupied_beds=32, monthly_revenue=256000, manager="Rajesh Kumar", phone="+91 98765 43210"),
            Property(name="Green Valley PG - Whitefield", address="ITPL Main Road, Whitefield, Bangalore - 560066", total_rooms=8, total_beds=24, occupied_beds=20, monthly_revenue=180000, manager="Priya Sharma", phone="+91 98765 43211"),
            Property(name="Royal Comfort PG - HSR Layout", address="Sector 2, HSR Layout, Bangalore - 560102", total_rooms=15, total_beds=45, occupied_beds=38, monthly_revenue=342000, manager="Amit Patel", phone="+91 98765 43212"),
        ]
        session.add_all(properties)
        session.commit()
        for p in properties:
            session.refresh(p)

        tenants = [
            Tenant(name="Rahul Verma", phone="+91 98765 11111", email="rahul.verma@email.com", property_id=properties[0].id, property_name=properties[0].name, room_number="101", bed_number="A", rent_amount=8000, rent_due_date="2026-04-05", rent_status="overdue", join_date="2025-09-15", advance=16000, aadhar_number="1234 5678 9012"),
            Tenant(name="Sneha Reddy", phone="+91 98765 22222", email="sneha.reddy@email.com", property_id=properties[0].id, property_name=properties[0].name, room_number="102", bed_number="B", rent_amount=8000, rent_due_date="2026-04-10", rent_status="paid", join_date="2025-08-20", advance=16000, aadhar_number="2345 6789 0123"),
            Tenant(name="Arjun Singh", phone="+91 98765 33333", email="arjun.singh@email.com", property_id=properties[1].id, property_name=properties[1].name, room_number="201", bed_number="A", rent_amount=9000, rent_due_date="2026-04-08", rent_status="due", join_date="2025-10-01", advance=18000, aadhar_number="3456 7890 1234"),
        ]
        session.add_all(tenants)

        complaints = [
            Complaint(tenant_id=1, tenant_name="Rahul Verma", property_id=properties[0].id, property_name=properties[0].name, category="Maintenance", title="AC not cooling properly", description="The AC in room 101 has been making noise and not cooling properly for the past 2 days.", status="in-progress", priority="high"),
            Complaint(tenant_id=3, tenant_name="Arjun Singh", property_id=properties[1].id, property_name=properties[1].name, category="Electrical", title="Power socket not working", description="One power socket near the study table is not working.", status="open", priority="medium"),
        ]
        session.add_all(complaints)

        if not session.exec(select(Room)).first():
            rooms = [
                Room(property_id=properties[0].id, property_name=properties[0].name, room_number="101", floor=1, total_beds=3, occupied_beds=2, rent_per_bed=8000, amenities="AC, Attached Bathroom, WiFi", status="partial"),
                Room(property_id=properties[0].id, property_name=properties[0].name, room_number="102", floor=1, total_beds=2, occupied_beds=2, rent_per_bed=8000, amenities="AC, WiFi", status="full"),
                Room(property_id=properties[1].id, property_name=properties[1].name, room_number="201", floor=2, total_beds=2, occupied_beds=1, rent_per_bed=9000, amenities="AC, Balcony, WiFi", status="partial"),
            ]
            session.add_all(rooms)

        if not session.exec(select(Notice)).first():
            notices = [
                Notice(title="Maintenance Work", content="Water tank cleaning on Sunday from 10 AM to 2 PM.", property_id=properties[0].id, property_name=properties[0].name, created_by="Rajesh Kumar", urgent=True),
                Notice(title="New WiFi Passcode", content="The WiFi passcode has been updated to 'Sunshine@2026'.", property_id=properties[0].id, property_name=properties[0].name, created_by="System"),
            ]
            session.add_all(notices)

        if not session.exec(select(RentTransaction)).first():
            transactions = [
                RentTransaction(tenant_id=2, tenant_name="Sneha Reddy", property_name=properties[0].name, amount=8000, month="April 2026", paid_date="2026-04-09", payment_mode="UPI", receipt_number="REC-1001"),
            ]
            session.add_all(transactions)

        if not session.exec(select(Staff)).first():
            staff = [
                Staff(name="Arjun Singh", role="Property Manager", email="arjun@pgmanager.com", phone="+91 98765 43210", property_id=properties[0].id, property_name=properties[0].name, status="Active", shift="Day"),
                Staff(name="Sita Devi", role="Housekeeping Head", email="sita@pgmanager.com", phone="+91 98765 43211", property_id=properties[0].id, property_name=properties[0].name, status="Active", shift="Day"),
                Staff(name="Rohan Varma", role="Security Guard", email="rohan@pgmanager.com", phone="+91 98765 43212", property_id=properties[1].id, property_name=properties[1].name, status="Active", shift="Night"),
            ]
            session.add_all(staff)

        session.commit()

# ─────────────────────────────────────────────────────────────────
#  PROPERTIES
# ─────────────────────────────────────────────────────────────────

@app.get("/properties", response_model=List[Property])
def get_properties(session: Session = Depends(get_session)):
    return session.exec(select(Property)).all()

@app.post("/properties", response_model=Property)
def create_property(prop_in: PropertyCreate, session: Session = Depends(get_session)):
    try:
        # 1. Calculate totals from the nested config
        total_rooms = sum(len(floor.rooms) for floor in prop_in.floors)
        total_beds = sum(room.beds for floor in prop_in.floors for room in floor.rooms)

        # 2. Create Property record
        db_prop = Property(
            name=prop_in.name,
            address=prop_in.address,
            manager=prop_in.manager,
            phone=prop_in.phone,
            total_rooms=total_rooms,
            total_beds=total_beds,
            occupied_beds=0,
            monthly_revenue=0.0
        )
        session.add(db_prop)
        session.commit()
        session.refresh(db_prop)

        # 3. Generate Rooms per floor/room config
        rooms = []
        for floor_idx, floor_cfg in enumerate(prop_in.floors):
            floor_number = floor_idx + 1
            for room_idx, room_cfg in enumerate(floor_cfg.rooms):
                room_number = f"{floor_number}{room_idx + 1:02d}"  # 101, 102... 201, 202...
                amenities = "WiFi, Attached Bathroom"
                if room_cfg.has_ac:
                    amenities = "AC, " + amenities
                new_room = Room(
                    property_id=db_prop.id,
                    property_name=db_prop.name,
                    room_number=room_number,
                    floor=floor_number,
                    total_beds=room_cfg.beds,
                    occupied_beds=0,
                    rent_per_bed=room_cfg.rent_per_bed,
                    amenities=amenities,
                    status="available"
                )
                rooms.append(new_room)

        session.add_all(rooms)
        session.commit()

        return db_prop
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate property: {str(e)}")


@app.get("/properties/{property_id}")
def get_property(property_id: int, session: Session = Depends(get_session)):
    db_prop = session.get(Property, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    rooms = session.exec(select(Room).where(Room.property_id == property_id)).all()
    tenants = session.exec(select(Tenant).where(Tenant.property_id == property_id)).all()
    complaints = session.exec(select(Complaint).where(Complaint.property_id == property_id)).all()
    
    return {
        "id": db_prop.id,
        "name": db_prop.name,
        "address": db_prop.address,
        "total_rooms": db_prop.total_rooms,
        "total_beds": db_prop.total_beds,
        "occupied_beds": db_prop.occupied_beds,
        "monthly_revenue": db_prop.monthly_revenue,
        "manager": db_prop.manager,
        "phone": db_prop.phone,
        "rooms": rooms,
        "tenants": tenants,
        "complaints": complaints
    }

@app.put("/properties/{property_id}", response_model=Property)
def update_property(property_id: int, property: Property, session: Session = Depends(get_session)):
    db_prop = session.get(Property, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop_data = property.dict(exclude_unset=True, exclude={"id"})
    for key, value in prop_data.items():
        setattr(db_prop, key, value)
    session.add(db_prop)
    session.commit()
    session.refresh(db_prop)
    return db_prop

@app.delete("/properties/{property_id}")
def delete_property(property_id: int, session: Session = Depends(get_session)):
    db_prop = session.get(Property, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    try:
        # 1. Delete associated Rooms
        session.exec(delete(Room).where(Room.property_id == property_id))
        
        # 2. Delete associated Tenants
        session.exec(delete(Tenant).where(Tenant.property_id == property_id))
        
        # 3. Delete associated Complaints
        session.exec(delete(Complaint).where(Complaint.property_id == property_id))
        
        # 4. Delete associated Notices
        session.exec(delete(Notice).where(Notice.property_id == property_id))
        
        # 5. Delete associated Staff assignments
        session.exec(delete(Staff).where(Staff.property_id == property_id))
        
        # 6. Delete associated Rent transactions (matching by property name)
        session.exec(delete(RentTransaction).where(RentTransaction.property_name == db_prop.name))
        
        # 7. Delete the Property itself
        session.delete(db_prop)
        
        session.commit()
        return {"message": f"Property '{db_prop.name}' and all associated data deleted successfully"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete property: {str(e)}")


# ─────────────────────────────────────────────────────────────────
#  TENANTS
# ─────────────────────────────────────────────────────────────────

@app.get("/tenants", response_model=List[Tenant])
def get_tenants(
    search: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    tenants = session.exec(select(Tenant)).all()
    if search:
        q = search.lower()
        tenants = [
            t for t in tenants
            if q in t.name.lower()
            or q in t.property_name.lower()
            or q in t.room_number.lower()
            or q in t.rent_status.lower()
        ]
    return tenants

@app.post("/tenants", response_model=Tenant)
def create_tenant(tenant: Tenant, session: Session = Depends(get_session)):
    try:
        # Resolve property name
        if not tenant.property_name:
            prop = session.get(Property, tenant.property_id)
            if prop:
                tenant.property_name = prop.name

        session.add(tenant)
        session.commit()
        session.refresh(tenant)

        # ── Auto-sync: increment room occupied_beds ──────────────
        room = session.exec(
            select(Room).where(
                Room.property_id == tenant.property_id,
                Room.room_number == tenant.room_number
            )
        ).first()
        if room:
            room.occupied_beds = min(room.occupied_beds + 1, room.total_beds)
            room.status = (
                "full" if room.occupied_beds >= room.total_beds
                else "partial" if room.occupied_beds > 0
                else "available"
            )
            session.add(room)

        # ── Auto-sync: increment property occupied_beds ──────────
        prop = session.get(Property, tenant.property_id)
        if prop:
            prop.occupied_beds = min(prop.occupied_beds + 1, prop.total_beds)
            prop.monthly_revenue = prop.monthly_revenue + tenant.rent_amount
            session.add(prop)

        session.commit()
        return tenant
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class TransferRequest(BaseModel):
    property_id: int
    room_number: str
    bed_number: str

@app.post("/tenants/{tenant_id}/transfer", response_model=Tenant)
def transfer_tenant(tenant_id: int, request: TransferRequest, session: Session = Depends(get_session)):
    try:
        db_tenant = session.get(Tenant, tenant_id)
        if not db_tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        old_property_id = db_tenant.property_id
        old_room_number = db_tenant.room_number

        # 1. Update old room if it exists
        old_room = session.exec(
            select(Room).where(
                Room.property_id == old_property_id,
                Room.room_number == old_room_number
            )
        ).first()
        if old_room:
            old_room.occupied_beds = max(0, old_room.occupied_beds - 1)
            old_room.status = (
                "full" if old_room.occupied_beds >= old_room.total_beds
                else "partial" if old_room.occupied_beds > 0
                else "available"
            )
            session.add(old_room)

        # 2. Update old property revenue if needed (simplification: decrement then increment)
        old_prop = session.get(Property, old_property_id)
        if old_prop:
            old_prop.occupied_beds = max(0, old_prop.occupied_beds - 1)
            old_prop.monthly_revenue = max(0, old_prop.monthly_revenue - db_tenant.rent_amount)
            session.add(old_prop)

        # 3. Update tenant to new location
        new_prop = session.get(Property, request.property_id)
        if not new_prop:
            raise HTTPException(status_code=404, detail="New property not found")
            
        db_tenant.property_id = request.property_id
        db_tenant.property_name = new_prop.name
        db_tenant.room_number = request.room_number
        db_tenant.bed_number = request.bed_number
        session.add(db_tenant)

        # 4. Update new room
        new_room = session.exec(
            select(Room).where(
                Room.property_id == request.property_id,
                Room.room_number == request.room_number
            )
        ).first()
        if new_room:
            new_room.occupied_beds = min(new_room.occupied_beds + 1, new_room.total_beds)
            new_room.status = (
                "full" if new_room.occupied_beds >= new_room.total_beds
                else "partial" if new_room.occupied_beds > 0
                else "available"
            )
            session.add(new_room)

        # 5. Update new property
        new_prop.occupied_beds = min(new_prop.occupied_beds + 1, new_prop.total_beds)
        new_prop.monthly_revenue = new_prop.monthly_revenue + db_tenant.rent_amount
        session.add(new_prop)

        session.commit()
        session.refresh(db_tenant)
        return db_tenant
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")

@app.put("/tenants/{tenant_id}", response_model=Tenant)
def update_tenant(tenant_id: int, data: dict, session: Session = Depends(get_session)):
    db_tenant = session.get(Tenant, tenant_id)
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for key, value in data.items():
        if hasattr(db_tenant, key) and key != "id":
            setattr(db_tenant, key, value)
    session.add(db_tenant)
    session.commit()
    session.refresh(db_tenant)
    return db_tenant

# ─────────────────────────────────────────────────────────────────
#  ROOMS
# ─────────────────────────────────────────────────────────────────

@app.get("/rooms", response_model=List[Room])
def get_rooms(session: Session = Depends(get_session)):
    return session.exec(select(Room)).all()

@app.post("/rooms", response_model=Room)
def create_room(room: Room, session: Session = Depends(get_session)):
    # Auto-resolve property_name if missing
    if not room.property_name:
        prop = session.get(Property, room.property_id)
        if prop:
            room.property_name = prop.name
    session.add(room)
    session.commit()
    session.refresh(room)
    return room

# ─────────────────────────────────────────────────────────────────
#  COMPLAINTS
# ─────────────────────────────────────────────────────────────────

@app.get("/complaints", response_model=List[Complaint])
def get_complaints(session: Session = Depends(get_session)):
    return session.exec(select(Complaint)).all()

@app.post("/complaints", response_model=Complaint)
def create_complaint(complaint: Complaint, session: Session = Depends(get_session)):
    # Auto-resolve tenant info if only tenant_id given
    if complaint.tenant_id and (not complaint.tenant_name or not complaint.property_name):
        tenant = session.get(Tenant, complaint.tenant_id)
        if tenant:
            if not complaint.tenant_name:
                complaint.tenant_name = tenant.name
            if not complaint.property_id:
                complaint.property_id = tenant.property_id
            if not complaint.property_name:
                complaint.property_name = tenant.property_name
    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}", response_model=Complaint)
def update_complaint(complaint_id: int, complaint: Complaint, session: Session = Depends(get_session)):
    db_complaint = session.get(Complaint, complaint_id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint_data = complaint.dict(exclude_unset=True, exclude={"id"})
    for key, value in complaint_data.items():
        setattr(db_complaint, key, value)
    if complaint_data.get("status") in ("resolved", "closed"):
        db_complaint.resolved_at = datetime.utcnow()
    session.add(db_complaint)
    session.commit()
    session.refresh(db_complaint)
    return db_complaint

@app.patch("/complaints/{complaint_id}/status")
def patch_complaint_status(complaint_id: int, data: dict, session: Session = Depends(get_session)):
    """Lightweight status-only update for the AI agent."""
    db_complaint = session.get(Complaint, complaint_id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    new_status = data.get("status")
    if new_status not in ("open", "in-progress", "resolved", "closed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    db_complaint.status = new_status
    if new_status in ("resolved", "closed"):
        db_complaint.resolved_at = datetime.utcnow()
    session.add(db_complaint)
    session.commit()
    return {"id": complaint_id, "status": new_status, "message": "Status updated"}

# ─────────────────────────────────────────────────────────────────
#  NOTICES
# ─────────────────────────────────────────────────────────────────

@app.get("/notices", response_model=List[Notice])
def get_notices(session: Session = Depends(get_session)):
    return session.exec(select(Notice)).all()

@app.post("/notices", response_model=Notice)
def create_notice(notice: Notice, session: Session = Depends(get_session)):
    # Auto-resolve property_name if missing
    if not notice.property_name:
        prop = session.get(Property, notice.property_id)
        if prop:
            notice.property_name = prop.name
    session.add(notice)
    session.commit()
    session.refresh(notice)
    return notice

# ─────────────────────────────────────────────────────────────────
#  RENT COLLECTION
# ─────────────────────────────────────────────────────────────────

@app.get("/rent-collection", response_model=List[RentTransaction])
def get_rent_collection(session: Session = Depends(get_session)):
    return session.exec(select(RentTransaction)).all()

@app.post("/rent-collection", response_model=RentTransaction)
def create_rent_transaction(transaction: RentTransaction, session: Session = Depends(get_session)):
    # Auto-resolve property_name if missing
    if transaction.tenant_id and not transaction.property_name:
        tenant = session.get(Tenant, transaction.tenant_id)
        if tenant:
            transaction.property_name = tenant.property_name
            transaction.tenant_name = tenant.name

    session.add(transaction)
    session.commit()
    session.refresh(transaction)

    # ── Auto-sync: mark tenant as paid ──────────────────────────
    if transaction.tenant_id:
        tenant = session.get(Tenant, transaction.tenant_id)
        if tenant:
            tenant.rent_status = "paid"
            session.add(tenant)
            session.commit()

    return transaction

# ─────────────────────────────────────────────────────────────────
#  STAFF / MANAGER MANAGEMENT
# ─────────────────────────────────────────────────────────────────

@app.get("/staff", response_model=List[Staff])
def get_staff(session: Session = Depends(get_session)):
    return session.exec(select(Staff)).all()

@app.post("/staff", response_model=Staff)
def create_staff(staff: Staff, session: Session = Depends(get_session)):
    try:
        # Auto-resolve property_name if property_id provided
        if staff.property_id and not staff.property_name:
            prop = session.get(Property, staff.property_id)
            if prop:
                staff.property_name = prop.name
                
        session.add(staff)
        session.commit()
        session.refresh(staff)
        return staff
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/staff/{staff_id}", response_model=Staff)
def update_staff(staff_id: int, staff_data: dict, session: Session = Depends(get_session)):
    db_staff = session.get(Staff, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    for key, value in staff_data.items():
        if hasattr(db_staff, key) and key != "id":
            # If property_id changed, update property_name too
            if key == "property_id" and value:
                prop = session.get(Property, value)
                if prop:
                    db_staff.property_name = prop.name
            setattr(db_staff, key, value)
            
    session.add(db_staff)
    session.commit()
    session.refresh(db_staff)
    return db_staff

@app.delete("/staff/{staff_id}")
def delete_staff(staff_id: int, session: Session = Depends(get_session)):
    db_staff = session.get(Staff, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    session.delete(db_staff)
    session.commit()
    return {"message": "Staff member deleted successfully"}

# ─────────────────────────────────────────────────────────────────
#  STATS
# ─────────────────────────────────────────────────────────────────

@app.get("/stats")
def get_stats(session: Session = Depends(get_session)):
    properties = session.exec(select(Property)).all()
    tenants = session.exec(select(Tenant)).all()
    complaints = session.exec(select(Complaint)).all()

    total_beds = sum(p.total_beds for p in properties)
    occupied_beds = sum(p.occupied_beds for p in properties)
    monthly_revenue = sum(p.monthly_revenue for p in properties)

    return {
        "total_properties": len(properties),
        "total_tenants": len(tenants),
        "occupancy_rate": round((occupied_beds / total_beds * 100)) if total_beds > 0 else 0,
        "monthly_revenue": monthly_revenue,
        "overdue_rents": len([t for t in tenants if t.rent_status == "overdue"]),
        "open_complaints": len([c for c in complaints if c.status in ["open", "in-progress"]])
    }

# ─────────────────────────────────────────────────────────────────
#  AI ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@app.get("/ai/insight")
def get_property_ai_insight(session: Session = Depends(get_session)):
    stats = get_stats(session)
    insight = get_ai_insight(stats)
    return {"insight": insight}

@app.post("/ai/chat")
def post_chat(request: dict, session: Session = Depends(get_session)):
    user_message = request.get("message", "")
    response = process_chat(user_message, [])
    return {"response": response}

@app.post("/ai/agent")
def ai_agent_endpoint(request: dict, session: Session = Depends(get_session)):
    """
    AI Agent with full data context + multi-turn chat history.
    Request body: { "message": str, "history": [{"role":..,"content":..}] }
    """
    user_message = request.get("message", "")
    chat_history = request.get("history", [])

    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")

    properties = session.exec(select(Property)).all()
    tenants = session.exec(select(Tenant)).all()
    complaints = session.exec(select(Complaint)).all()
    rooms = session.exec(select(Room)).all()
    notices = session.exec(select(Notice)).all()
    transactions = session.exec(select(RentTransaction)).all()

    total_beds = sum(p.total_beds for p in properties)
    occupied_beds = sum(p.occupied_beds for p in properties)
    monthly_revenue = sum(p.monthly_revenue for p in properties)

    data_context = {
        "total_properties": len(properties),
        "total_tenants": len(tenants),
        "occupancy_rate": round((occupied_beds / total_beds * 100)) if total_beds > 0 else 0,
        "monthly_revenue": monthly_revenue,
        "overdue_rents": len([t for t in tenants if t.rent_status == "overdue"]),
        "open_complaints": len([c for c in complaints if c.status in ["open", "in-progress"]]),
        "properties": [
            {"id": p.id, "name": p.name, "address": p.address, "total_rooms": p.total_rooms,
             "total_beds": p.total_beds, "occupied_beds": p.occupied_beds,
             "monthly_revenue": p.monthly_revenue, "manager": p.manager}
            for p in properties
        ],
        "tenants_summary": [
            {"id": t.id, "name": t.name, "property": t.property_name,
             "room": t.room_number, "bed": t.bed_number,
             "rent_status": t.rent_status, "rent_amount": t.rent_amount,
             "phone": t.phone, "email": t.email}
            for t in tenants
        ],
        "overdue_tenants": [
            {"id": t.id, "name": t.name, "property": t.property_name,
             "rent_amount": t.rent_amount, "phone": t.phone, "email": t.email}
            for t in tenants if t.rent_status == "overdue"
        ],
        "open_complaints_list": [
            {"id": c.id, "tenant": c.tenant_name, "title": c.title,
             "category": c.category, "priority": c.priority, "status": c.status}
            for c in complaints if c.status in ["open", "in-progress"]
        ]
    }

    result = process_ai_agent(user_message, data_context, chat_history)
    return result

@app.post("/ai/send-rent-reminders")
def send_rent_reminders(session: Session = Depends(get_session)):
    """Send rent reminders to tenants with overdue/due rent"""
    tenants = session.exec(select(Tenant)).all()
    overdue_tenants = [t for t in tenants if t.rent_status in ["overdue", "due"]]

    reminders_sent = []
    for tenant in overdue_tenants:
        message_body = f"Dear {tenant.name}, this is a reminder that your rent of ₹{tenant.rent_amount} for {tenant.property_name} is due on {tenant.rent_due_date}. Please arrange payment at your earliest convenience."
        
        # Save notice to DB
        notice = Notice(
            title="Rent Payment Reminder",
            content=message_body,
            property_id=tenant.property_id,
            property_name=tenant.property_name,
            created_by="AI Agent",
            urgent=True if tenant.rent_status == "overdue" else False
        )
        session.add(notice)
        
        # TRIGGER REAL MESSAGING
        if tenant.phone:
            send_dual_reminder(tenant.phone, message_body)
            
        reminders_sent.append(tenant.name)

    session.commit()
    return {
        "status": "success",
        "message": f"Reminders sent to {len(reminders_sent)} tenants",
        "tenants": reminders_sent
    }

@app.post("/ai/property-analysis")
def property_analysis(session: Session = Depends(get_session)):
    """Analyze property performance"""
    properties = session.exec(select(Property)).all()
    analysis = []
    for prop in properties:
        occupancy = (prop.occupied_beds / prop.total_beds * 100) if prop.total_beds > 0 else 0
        analysis.append({
            "property": prop.name,
            "occupancy_rate": round(occupancy, 2),
            "monthly_revenue": prop.monthly_revenue,
            "manager": prop.manager
        })
    return {"analysis": analysis}

@app.get("/ai/tenant-search/{property_id}")
def search_tenants_in_property(property_id: int, session: Session = Depends(get_session)):
    """Get all tenants in a specific property"""
    tenants = session.exec(select(Tenant).where(Tenant.property_id == property_id)).all()
    return {"property_id": property_id, "tenants": tenants}

@app.post("/ai/broadcast-notice")
def broadcast_notice(request: dict, session: Session = Depends(get_session)):
    """
    Broadcast a notice to all tenants of a property via WhatsApp/SMS
    Request: { "property_id": int, "title": str, "content": str }
    """
    property_id = request.get("property_id")
    title = request.get("title", "Important Notice")
    content = request.get("content", "")
    
    if not property_id or not content:
        raise HTTPException(status_code=400, detail="property_id and content are required")
        
    prop = session.get(Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    tenants = session.exec(select(Tenant).where(Tenant.property_id == property_id)).all()
    
    delivery_count = 0
    for tenant in tenants:
        if tenant.phone:
            send_dual_reminder(tenant.phone, f"*{title}*\n\n{content}")
            delivery_count += 1
            
    # Also save notice in DB
    db_notice = Notice(
        title=title,
        content=content,
        property_id=property_id,
        property_name=prop.name,
        created_by="AI Agent (Broadcast)"
    )
    session.add(db_notice)
    session.commit()
    
    return {"status": "success", "delivered_to": delivery_count, "total_tenants": len(tenants)}

# ─────────────────────────────────────────────────────────────────
#  TENANT PORTAL ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@app.post("/tenant/login")
def tenant_login(request: dict, session: Session = Depends(get_session)):
    email = request.get("email")
    phone = request.get("phone")
    
    if not email or not phone:
        raise HTTPException(status_code=400, detail="Email and Phone are required")
        
    tenant = session.exec(select(Tenant).where(
        Tenant.email == email,
        Tenant.phone == phone
    )).first()
    
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please check your email and phone number.")
        
    return {
        "id": tenant.id,
        "name": tenant.name,
        "property_id": tenant.property_id,
        "property_name": tenant.property_name,
        "role": "tenant"
    }

@app.get("/tenant/dashboard/{tenant_id}")
def get_tenant_dashboard(tenant_id: int, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    # Get property details
    prop = session.get(Property, tenant.property_id)
    
    # Get room details
    room = session.exec(select(Room).where(
        Room.property_id == tenant.property_id,
        Room.room_number == tenant.room_number
    )).first()
    
    # Get recent notices for this property
    notices = session.exec(select(Notice).where(
        Notice.property_id == tenant.property_id
    ).order_by(Notice.created_at.desc())).all()
    
    # Get recent complaints by this tenant
    complaints = session.exec(select(Complaint).where(
        Complaint.tenant_id == tenant_id
    ).order_by(Complaint.created_at.desc())).all()
    
    # Get payment history
    transactions = session.exec(select(RentTransaction).where(
        RentTransaction.tenant_id == tenant_id
    ).order_by(RentTransaction.paid_date.desc())).all()
    
    return {
        "tenant": tenant,
        "property": prop,
        "room": room,
        "notices": notices,
        "complaints": complaints,
        "transactions": transactions
    }
