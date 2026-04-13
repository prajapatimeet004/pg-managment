from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
from .database import engine, create_db_and_tables, get_session
from .models import Property, Tenant, Room, Complaint, Notice, RentTransaction
from .ai_service import get_ai_insight, process_chat, process_ai_agent
from datetime import datetime

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
        # Check if already seeded
        if session.exec(select(Property)).first():
            return

        # Seed Properties
        properties = [
            Property(name="Sunshine PG - Koramangala", address="5th Block, Koramangala, Bangalore - 560095", total_rooms=12, total_beds=36, occupied_beds=32, monthly_revenue=256000, manager="Rajesh Kumar", phone="+91 98765 43210"),
            Property(name="Green Valley PG - Whitefield", address="ITPL Main Road, Whitefield, Bangalore - 560066", total_rooms=8, total_beds=24, occupied_beds=20, monthly_revenue=180000, manager="Priya Sharma", phone="+91 98765 43211"),
            Property(name="Royal Comfort PG - HSR Layout", address="Sector 2, HSR Layout, Bangalore - 560102", total_rooms=15, total_beds=45, occupied_beds=38, monthly_revenue=342000, manager="Amit Patel", phone="+91 98765 43212"),
        ]
        session.add_all(properties)
        session.commit()
        for p in properties:
            session.refresh(p)

        # Seed Tenants
        tenants = [
            Tenant(name="Rahul Verma", phone="+91 98765 11111", email="rahul.verma@email.com", property_id=properties[0].id, property_name=properties[0].name, room_number="101", bed_number="A", rent_amount=8000, rent_due_date="2026-04-05", rent_status="overdue", join_date="2025-09-15", advance=16000, aadhar_number="1234 5678 9012"),
            Tenant(name="Sneha Reddy", phone="+91 98765 22222", email="sneha.reddy@email.com", property_id=properties[0].id, property_name=properties[0].name, room_number="102", bed_number="B", rent_amount=8000, rent_due_date="2026-04-10", rent_status="paid", join_date="2025-08-20", advance=16000, aadhar_number="2345 6789 0123"),
            Tenant(name="Arjun Singh", phone="+91 98765 33333", email="arjun.singh@email.com", property_id=properties[1].id, property_name=properties[1].name, room_number="201", bed_number="A", rent_amount=9000, rent_due_date="2026-04-08", rent_status="due", join_date="2025-10-01", advance=18000, aadhar_number="3456 7890 1234"),
        ]
        session.add_all(tenants)
        
        # Seed Complaints
        complaints = [
            Complaint(tenant_id=1, tenant_name="Rahul Verma", property_id=properties[0].id, property_name=properties[0].name, category="Maintenance", title="AC not cooling properly", description="The AC in room 101 has been making noise and not cooling properly for the past 2 days.", status="in-progress", priority="high"),
            Complaint(tenant_id=3, tenant_name="Arjun Singh", property_id=properties[1].id, property_name=properties[1].name, category="Electrical", title="Power socket not working", description="One power socket near the study table is not working.", status="open", priority="medium"),
        ]
        session.add_all(complaints)
        # Seed Rooms
        if not session.exec(select(Room)).first():
            rooms = [
                Room(property_id=properties[0].id, property_name=properties[0].name, room_number="101", floor=1, total_beds=3, occupied_beds=2, rent_per_bed=8000, amenities="AC, Attached Bathroom, WiFi", status="partial"),
                Room(property_id=properties[0].id, property_name=properties[0].name, room_number="102", floor=1, total_beds=2, occupied_beds=2, rent_per_bed=8000, amenities="AC, WiFi", status="full"),
                Room(property_id=properties[1].id, property_name=properties[1].name, room_number="201", floor=2, total_beds=2, occupied_beds=1, rent_per_bed=9000, amenities="AC, Balcony, WiFi", status="partial"),
            ]
            session.add_all(rooms)

        # Seed Notices
        if not session.exec(select(Notice)).first():
            notices = [
                Notice(title="Maintenance Work", content="Water tank cleaning on Sunday from 10 AM to 2 PM.", property_id=properties[0].id, property_name=properties[0].name, created_by="Rajesh Kumar", urgent=True),
                Notice(title="New WiFi Passcode", content="The WiFi passcode has been updated to 'Sunshine@2026'.", property_id=properties[0].id, property_name=properties[0].name, created_by="System"),
            ]
            session.add_all(notices)

        # Seed Transactions
        if not session.exec(select(RentTransaction)).first():
            transactions = [
                RentTransaction(tenant_id=2, tenant_name="Sneha Reddy", property_name=properties[0].name, amount=8000, month="April 2026", paid_date="2026-04-09", payment_mode="UPI", receipt_number="REC-1001"),
            ]
            session.add_all(transactions)

        session.commit()

@app.get("/properties", response_model=List[Property])
def get_properties(session: Session = Depends(get_session)):
    return session.exec(select(Property)).all()

@app.post("/properties", response_model=Property)
def create_property(property: Property, session: Session = Depends(get_session)):
    try:
        session.add(property)
        session.commit()
        session.refresh(property)
        return property
    except Exception as e:
        session.rollback()
        print(f"Error creating property: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/tenants", response_model=List[Tenant])
def get_tenants(session: Session = Depends(get_session)):
    return session.exec(select(Tenant)).all()

@app.post("/tenants", response_model=Tenant)
def create_tenant(tenant: Tenant, session: Session = Depends(get_session)):
    try:
        # Automatically add property_name if not provided
        if not tenant.property_name:
            prop = session.get(Property, tenant.property_id)
            if prop:
                tenant.property_name = prop.name
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
        return tenant
    except Exception as e:
        session.rollback()
        print(f"Error creating tenant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/rooms", response_model=List[Room])
def get_rooms(session: Session = Depends(get_session)):
    return session.exec(select(Room)).all()

@app.post("/rooms", response_model=Room)
def create_room(room: Room, session: Session = Depends(get_session)):
    session.add(room)
    session.commit()
    session.refresh(room)
    return room

@app.get("/complaints", response_model=List[Complaint])
def get_complaints(session: Session = Depends(get_session)):
    return session.exec(select(Complaint)).all()

@app.post("/complaints", response_model=Complaint)
def create_complaint(complaint: Complaint, session: Session = Depends(get_session)):
    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}", response_model=Complaint)
def update_complaint(complaint_id: int, complaint: Complaint, session: Session = Depends(get_session)):
    """Update a complaint (status, etc)"""
    db_complaint = session.get(Complaint, complaint_id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint_data = complaint.dict(exclude_unset=True)
    for key, value in complaint_data.items():
        setattr(db_complaint, key, value)
    
    session.add(db_complaint)
    session.commit()
    session.refresh(db_complaint)
    return db_complaint

@app.get("/notices", response_model=List[Notice])
def get_notices(session: Session = Depends(get_session)):
    return session.exec(select(Notice)).all()

@app.post("/notices", response_model=Notice)
def create_notice(notice: Notice, session: Session = Depends(get_session)):
    session.add(notice)
    session.commit()
    session.refresh(notice)
    return notice

@app.get("/rent-collection", response_model=List[RentTransaction])
def get_rent_collection(session: Session = Depends(get_session)):
    return session.exec(select(RentTransaction)).all()

@app.post("/rent-collection", response_model=RentTransaction)
def create_rent_transaction(transaction: RentTransaction, session: Session = Depends(get_session)):
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

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
    AI Agent endpoint that has access to all data and can perform actions
    """
    user_message = request.get("message", "")
    
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Gather all data context
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
            {
                "id": p.id,
                "name": p.name,
                "address": p.address,
                "total_rooms": p.total_rooms,
                "total_beds": p.total_beds,
                "occupied_beds": p.occupied_beds,
                "monthly_revenue": p.monthly_revenue,
                "manager": p.manager
            }
            for p in properties
        ],
        "tenants_summary": [
            {
                "id": t.id,
                "name": t.name,
                "property": t.property_name,
                "rent_status": t.rent_status,
                "rent_amount": t.rent_amount
            }
            for t in tenants
        ],
        "overdue_tenants": [
            {
                "name": t.name,
                "property": t.property_name,
                "rent_amount": t.rent_amount,
                "phone": t.phone,
                "email": t.email
            }
            for t in tenants if t.rent_status == "overdue"
        ],
        "open_complaints_list": [
            {
                "id": c.id,
                "tenant": c.tenant_name,
                "title": c.title,
                "category": c.category,
                "priority": c.priority,
                "status": c.status
            }
            for c in complaints if c.status in ["open", "in-progress"]
        ]
    }
    
    # Process through AI agent
    result = process_ai_agent(user_message, data_context)
    
    return result

# Helper endpoints for AI to perform common tasks
@app.post("/ai/send-rent-reminders")
def send_rent_reminders(session: Session = Depends(get_session)):
    """Send rent reminders to tenants with overdue/due rent"""
    tenants = session.exec(select(Tenant)).all()
    overdue_tenants = [t for t in tenants if t.rent_status in ["overdue", "due"]]
    
    reminders_sent = []
    for tenant in overdue_tenants:
        notice = Notice(
            title="Rent Payment Reminder",
            content=f"Dear {tenant.name}, this is a reminder that your rent of ₹{tenant.rent_amount} for {tenant.property_name} is due on {tenant.rent_due_date}. Please arrange payment at your earliest convenience. Contact us if you have any questions.",
            property_id=tenant.property_id,
            property_name=tenant.property_name,
            created_by="AI Agent",
            urgent=True if tenant.rent_status == "overdue" else False
        )
        session.add(notice)
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
