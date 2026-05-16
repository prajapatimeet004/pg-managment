# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\auth.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import get_session
from schemas.auth_schemas import OwnerSignup, OwnerLogin, OTPVerify, TenantLogin
from repositories import AuthRepository, StaffRepository, TenantRepository
from services.auth_service import AuthService

router = APIRouter(tags=["auth"])

def get_auth_service(session: Session = Depends(get_session)):
    return AuthService(
        AuthRepository(session),
        StaffRepository(session),
        TenantRepository(session)
    )

@router.post("/owner/signup")
def owner_signup(
    signup_data: OwnerSignup, 
    service: AuthService = Depends(get_auth_service)
):
    return service.owner_signup(signup_data)

@router.post("/login")
def login(
    login_data: OwnerLogin, 
    service: AuthService = Depends(get_auth_service)
):
    return service.login(login_data)

@router.post("/owner/login")
def owner_login(
    login_data: OwnerLogin, 
    service: AuthService = Depends(get_auth_service)
):
    return service.login(login_data)

@router.post("/owner/verify-otp")
def verify_otp(
    verify_data: OTPVerify, 
    service: AuthService = Depends(get_auth_service)
):
    return service.verify_otp(verify_data)

@router.post("/tenant/login")
def tenant_login(
    login_data: TenantLogin, 
    service: AuthService = Depends(get_auth_service)
):
    return service.tenant_login(login_data)

@router.get("/tenant/dashboard/{tenant_id}")
def get_tenant_dashboard(
    tenant_id: int, 
    session: Session = Depends(get_session)
):
    # This was originally in main.py, keeping it simple in auth or moving to tenant.
    # The requirement is to keep all paths exact.
    # It requires models directly, we will query via session for brevity as it's a dashboard view
    from models import Tenant, Property, Room, Notice, Complaint, RentTransaction
    from sqlmodel import select
    from fastapi import HTTPException
    
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    prop = session.get(Property, tenant.property_id)
    room = session.exec(select(Room).where(Room.property_id == tenant.property_id, Room.room_number == tenant.room_number)).first()
    notices = session.exec(select(Notice).where(Notice.property_id == tenant.property_id).order_by(Notice.created_at.desc())).all()
    complaints = session.exec(select(Complaint).where(Complaint.tenant_id == tenant_id).order_by(Complaint.created_at.desc())).all()
    transactions = session.exec(select(RentTransaction).where(RentTransaction.tenant_id == tenant_id).order_by(RentTransaction.paid_date.desc())).all()
    
    return {
        "tenant": tenant.model_dump(),
        "property": prop.model_dump() if prop else None,
        "room": room.model_dump() if room else None,
        "notices": [n.model_dump() for n in notices],
        "complaints": [c.model_dump() for c in complaints],
        "transactions": [t.model_dump() for t in transactions]
    }
