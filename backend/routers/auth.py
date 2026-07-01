# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from database import get_session
from schemas.auth_schemas import OwnerSignup, OwnerLogin, OTPVerify, TenantLogin
from schemas.complaint_schemas import ComplaintCreate, ComplaintStatusPatch, ComplaintResponse
from schemas.rent_schemas import RentTransactionCreate, RentTransactionResponse
from repositories import AuthRepository, StaffRepository, TenantRepository, ComplaintRepository, RentRepository
from services.auth_service import AuthService
from services.complaint_service import ComplaintService
from services.rent_service import RentService
from security import get_current_tenant
from routers.websocket import manager

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
    session: Session = Depends(get_session),
):
    """Tenant dashboard — validated by tenant_id in URL (no JWT required)."""
    from models import Tenant, Property, Room, Notice, Complaint, RentTransaction
    from sqlmodel import select
    
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    prop = session.get(Property, tenant.property_id)
    prop_data = prop.model_dump() if prop else None
    if prop_data:
        from models import Staff
        import re as _re
        all_staff = session.exec(select(Staff).where(Staff.owner_id == tenant.owner_id)).all()
        for s in all_staff:
            s_pids = []
            if s.property_ids:
                s_pids = [int(i) for i in _re.findall(r"\d+", s.property_ids) if i]
            elif s.property_id:
                s_pids = [s.property_id]
            if tenant.property_id in s_pids and s.role in ("Property Manager", "Manager") and s.status == "Active":
                prop_data["manager"] = s.name
                prop_data["phone"] = s.phone
                break

    room = session.exec(select(Room).where(Room.property_id == tenant.property_id, Room.room_number == tenant.room_number)).first()
    notices = session.exec(select(Notice).where((Notice.property_id == tenant.property_id) | (Notice.property_id == 0)).order_by(Notice.created_at.desc())).all()
    complaints = session.exec(select(Complaint).where(Complaint.tenant_id == tenant_id).order_by(Complaint.created_at.desc())).all()
    transactions = session.exec(select(RentTransaction).where(RentTransaction.tenant_id == tenant_id).order_by(RentTransaction.paid_date.desc())).all()
    
    return {
        "tenant": tenant.model_dump(),
        "property": prop_data,
        "room": room.model_dump() if room else None,
        "notices": [n.model_dump() for n in notices],
        "complaints": [c.model_dump() for c in complaints],
        "transactions": [t.model_dump() for t in transactions]
    }


# ── Tenant Complaint Endpoints (validated by tenant_id — no JWT required) ────

def get_complaint_service(session: Session = Depends(get_session)):
    return ComplaintService(
        ComplaintRepository(session),
        TenantRepository(session)
    )

@router.post("/tenant/complaints", response_model=ComplaintResponse)
async def tenant_create_complaint(
    complaint_in: ComplaintCreate,
    service: ComplaintService = Depends(get_complaint_service),
    session: Session = Depends(get_session)
):
    """Tenant submits a complaint — tenant_id in body is used to look up tenant info."""
    from models import Tenant
    tenant = session.get(Tenant, complaint_in.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    result = service.create(complaint_in)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    await manager.broadcast({
        "type": "notification",
        "category": "complaint_created",
        "title": "⚠️ New Complaint Raised",
        "message": f"{result.tenant_name} ({result.property_name}): {result.title}",
        "tenant_id": result.tenant_id,
        "tenant_name": result.tenant_name,
        "property_id": result.property_id,
        "property_name": result.property_name,
        "complaint_title": result.title,
        "priority": result.priority
    })
    return result

@router.patch("/tenant/complaints/{complaint_id}/status")
async def tenant_patch_complaint_status(
    complaint_id: int,
    patch: ComplaintStatusPatch,
    service: ComplaintService = Depends(get_complaint_service)
):
    """Tenant closes their own ticket — no JWT required."""
    complaint = service.repo.get_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    result = service.patch_status(complaint_id, patch)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    return result

@router.delete("/tenant/complaints/{complaint_id}")
async def tenant_delete_complaint(
    complaint_id: int,
    service: ComplaintService = Depends(get_complaint_service)
):
    """Tenant deletes their own open complaint — no JWT required."""
    complaint = service.repo.get_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    result = service.delete(complaint_id)
    await manager.broadcast({"type": "data_updated", "entity": "complaints"})
    return {"message": result}


# ── Tenant Rent Payment Endpoint (no JWT required) ─────────────────────────

def get_rent_service(session: Session = Depends(get_session)):
    return RentService(
        RentRepository(session),
        TenantRepository(session)
    )

@router.post("/tenant/rent-collection", response_model=RentTransactionResponse)
async def tenant_pay_rent(
    transaction_in: RentTransactionCreate,
    service: RentService = Depends(get_rent_service),
    session: Session = Depends(get_session)
):
    """Tenant pays rent — auto-fills owner_id from tenant record. No JWT required."""
    from models import Tenant
    tenant = session.get(Tenant, transaction_in.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    # Auto-fill owner_id from the tenant record so payment is attributed correctly
    if not transaction_in.owner_id:
        transaction_in.owner_id = tenant.owner_id
    result = service.create(transaction_in)
    await manager.broadcast({"type": "data_updated", "entity": "tenants"})
    await manager.broadcast({"type": "data_updated", "entity": "rent"})
    await manager.broadcast({
        "type": "notification",
        "category": "rent_paid",
        "title": "Rent Payment Received 💰",
        "message": f"{result.tenant_name} paid ₹{int(result.amount):,} for {result.month}",
        "tenant_id": result.tenant_id,
        "tenant_name": result.tenant_name,
        "property_id": result.property_id,
        "property_name": result.property_name,
        "amount": result.amount,
        "month": result.month,
        "receipt_number": result.receipt_number
    })
    return result
