# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\auth_service.py
from fastapi import HTTPException
from models import Owner, Property, Tenant, Room, Complaint, Notice, RentTransaction, Staff
from schemas.auth_schemas import OwnerSignup, OwnerLogin, OTPVerify, TenantLogin
from repositories import AuthRepository, StaffRepository, TenantRepository
from email_service import send_otp_email
from datetime import datetime, timedelta, timezone
import random

class AuthService:
    def __init__(self, auth_repo: AuthRepository, staff_repo: StaffRepository, tenant_repo: TenantRepository):
        self.auth_repo = auth_repo
        self.staff_repo = staff_repo
        self.tenant_repo = tenant_repo

    def owner_signup(self, signup_data: OwnerSignup) -> dict:
        email = signup_data.email
        password = signup_data.password
        name = signup_data.name

        existing = self.auth_repo.get_owner_by_email(email)
        if existing:
            if existing.is_verified:
                raise HTTPException(status_code=400, detail="Email already registered")
            else:
                owner = existing
                owner.password = password
                owner.name = name
        else:
            owner = Owner(email=email, password=password, name=name, is_verified=False)
            owner = self.auth_repo.create_owner(owner)

        otp = f"{random.randint(100000, 999999)}"
        owner.otp = otp
        owner.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        self.auth_repo.update_owner(owner)

        send_otp_email(email, otp, name)
        return {"status": "otp_pending", "email": email}

    def login(self, login_data: OwnerLogin) -> dict:
        owner = self.auth_repo.get_owner_by_email_and_password(login_data.email, login_data.password)
        if owner:
            return {
                "id": owner.id, 
                "name": owner.name, 
                "email": owner.email, 
                "role": "Owner",
                "owner_id": owner.id
            }
        
        staff = self.staff_repo.get_by_email_and_password(login_data.email, login_data.password)
        if staff:
            if staff.role not in ["Property Manager", "Manager", "Admin"]:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied: Only owners and managers are allowed to log in."
                )
            prop_ids = []
            if staff.property_ids:
                import re
                # Extract only digits and join them, then split by comma
                clean_ids = re.findall(r'\d+', staff.property_ids)
                prop_ids = [int(i) for i in clean_ids if i]
            elif staff.property_id:
                prop_ids = [staff.property_id]
                
            return {
                "id": staff.id,
                "name": staff.name,
                "email": staff.email,
                "role": staff.role,
                "property_id": staff.property_id, # Keep primary for compatibility
                "property_ids": prop_ids,
                "property_names": staff.property_names.split(",") if staff.property_names else [],
                "owner_id": staff.owner_id
            }
            
        raise HTTPException(status_code=401, detail="Invalid email or password")

    def verify_otp(self, verify_data: OTPVerify) -> dict:
        owner = self.auth_repo.get_owner_by_email(verify_data.email)
        if not owner:
            raise HTTPException(status_code=404, detail="User not found")
        
        if owner.otp != verify_data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        current_time = datetime.now(timezone.utc)
        if owner.otp_expiry.tzinfo is None:
            current_time = datetime.utcnow()
            
        if owner.otp_expiry < current_time:
            raise HTTPException(status_code=400, detail="OTP expired")
        
        owner.is_verified = True
        owner.otp = None
        owner.otp_expiry = None
        self.auth_repo.update_owner(owner)
        
        # Add starter dummy data for the new owner
        self.starter_seed(owner)
        
        return {"id": owner.id, "name": owner.name, "email": owner.email}

    def tenant_login(self, login_data: TenantLogin) -> dict:
        phone = login_data.phone.strip()
        tenant = None
        if login_data.email:
            tenant = self.tenant_repo.get_by_email_and_phone(login_data.email, phone)
        elif login_data.tenant_id:
            tenant = self.tenant_repo.get_by_id_and_phone(login_data.tenant_id, phone)
            
        if not tenant:
            raise HTTPException(
                status_code=401, 
                detail="Invalid credentials. Please check your email or Tenant ID and phone number."
            )
            
        return {
            "id": tenant.id,
            "name": tenant.name,
            "property_id": tenant.property_id,
            "property_name": tenant.property_name,
            "role": "tenant"
        }

    def starter_seed(self, owner: Owner):
        """Adds a comprehensive starter PG setup for new owners to provide a fully populated dashboard experience."""
        try:
            from seed_all_owners import seed_for_owner
            session = self.auth_repo.session
            print(f"Provisioning starter pack for new owner: {owner.email}")
            seed_for_owner(session, owner)
        except Exception as e:
            print(f"Failed to provision starter pack: {str(e)}")

    def seed_data(self):
        session = self.auth_repo.session
        from sqlmodel import select
        if session.exec(select(Property)).first():
            return

        admin_owner = Owner(email="admin@pgpro.com", password="password123", name="Super Admin", is_verified=True)
        session.add(admin_owner)
        session.commit()
        session.refresh(admin_owner)

        properties = [
            Property(name="Sunshine PG - Koramangala", address="5th Block, Koramangala, Bangalore - 560095", total_rooms=12, total_beds=36, occupied_beds=32, monthly_revenue=256000, manager="Rajesh Kumar", phone="+91 98765 43210", owner_id=admin_owner.id),
            Property(name="Green Valley PG - Whitefield", address="ITPL Main Road, Whitefield, Bangalore - 560066", total_rooms=8, total_beds=24, occupied_beds=20, monthly_revenue=180000, manager="Priya Sharma", phone="+91 98765 43211", owner_id=admin_owner.id),
            Property(name="Royal Comfort PG - HSR Layout", address="Sector 2, HSR Layout, Bangalore - 560102", total_rooms=15, total_beds=45, occupied_beds=38, monthly_revenue=342000, manager="Amit Patel", phone="+91 98765 43212", owner_id=admin_owner.id),
        ]
        session.add_all(properties)
        session.commit()
        for p in properties:
            session.refresh(p)

        tenants = [
            Tenant(name="Rahul Verma", phone="+91 98765 11111", email="rahul.verma@email.com", property_id=properties[0].id, property_name=properties[0].name, room_number="101", bed_number="A", rent_amount=8000, rent_due_date="2026-04-05", rent_status="overdue", join_date="2025-09-15", advance=16000, aadhar_number="1234 5678 9012", owner_id=admin_owner.id),
            Tenant(name="Sneha Reddy", phone="+91 98765 22222", email="sneha.reddy@email.com", property_id=properties[0].id, property_name=properties[0].name, room_number="102", bed_number="B", rent_amount=8000, rent_due_date="2026-04-10", rent_status="paid", join_date="2025-08-20", advance=16000, aadhar_number="2345 6789 0123", owner_id=admin_owner.id),
            Tenant(name="Arjun Singh", phone="+91 98765 33333", email="arjun.singh@email.com", property_id=properties[1].id, property_name=properties[1].name, room_number="201", bed_number="A", rent_amount=9000, rent_due_date="2026-04-08", rent_status="due", join_date="2025-10-01", advance=18000, aadhar_number="3456 7890 1234", owner_id=admin_owner.id),
        ]
        session.add_all(tenants)

        complaints = [
            Complaint(tenant_id=1, tenant_name="Rahul Verma", property_id=properties[0].id, property_name=properties[0].name, category="Maintenance", title="AC not cooling properly", description="The AC in room 101 has been making noise and not cooling properly for the past 2 days.", status="in-progress", priority="high", owner_id=admin_owner.id),
            Complaint(tenant_id=3, tenant_name="Arjun Singh", property_id=properties[1].id, property_name=properties[1].name, category="Electrical", title="Power socket not working", description="One power socket near the study table is not working.", status="open", priority="medium", owner_id=admin_owner.id),
        ]
        session.add_all(complaints)

        if not session.exec(select(Room)).first():
            rooms = [
                Room(property_id=properties[0].id, property_name=properties[0].name, room_number="101", floor=1, total_beds=3, occupied_beds=2, rent_per_bed=8000, amenities="AC, Attached Bathroom, WiFi", status="partial", owner_id=admin_owner.id),
                Room(property_id=properties[0].id, property_name=properties[0].name, room_number="102", floor=1, total_beds=2, occupied_beds=2, rent_per_bed=8000, amenities="AC, WiFi", status="full", owner_id=admin_owner.id),
                Room(property_id=properties[1].id, property_name=properties[1].name, room_number="201", floor=2, total_beds=2, occupied_beds=1, rent_per_bed=9000, amenities="AC, Balcony, WiFi", status="partial", owner_id=admin_owner.id),
            ]
            session.add_all(rooms)

        if not session.exec(select(Notice)).first():
            notices = [
                Notice(title="Maintenance Work", content="Water tank cleaning on Sunday from 10 AM to 2 PM.", property_id=properties[0].id, property_name=properties[0].name, created_by="Rajesh Kumar", urgent=True, owner_id=admin_owner.id),
                Notice(title="New WiFi Passcode", content="The WiFi passcode has been updated to 'Sunshine@2026'.", property_id=properties[0].id, property_name=properties[0].name, created_by="System", owner_id=admin_owner.id),
            ]
            session.add_all(notices)

        if not session.exec(select(RentTransaction)).first():
            transactions = [
                RentTransaction(tenant_id=2, tenant_name="Sneha Reddy", property_name=properties[0].name, amount=8000, month="April 2026", paid_date="2026-04-09", payment_mode="UPI", receipt_number="REC-1001", owner_id=admin_owner.id),
            ]
            session.add_all(transactions)

        if not session.exec(select(Staff)).first():
            staff = [
                Staff(name="Arjun Singh", role="Property Manager", email="arjun@pgmanager.com", phone="+91 98765 43210", property_id=properties[0].id, property_name=properties[0].name, status="Active", shift="Day", owner_id=admin_owner.id),
                Staff(name="Sita Devi", role="Housekeeping Head", email="sita@pgmanager.com", phone="+91 98765 43211", property_id=properties[0].id, property_name=properties[0].name, status="Active", shift="Day", owner_id=admin_owner.id),
                Staff(name="Rohan Varma", role="Security Guard", email="rohan@pgmanager.com", phone="+91 98765 43212", property_id=properties[1].id, property_name=properties[1].name, status="Active", shift="Night", owner_id=admin_owner.id),
            ]
            session.add_all(staff)

        session.commit()
