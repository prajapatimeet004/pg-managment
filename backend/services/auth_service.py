# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\auth_service.py
from fastapi import HTTPException
from models import Owner, Property, Tenant, Room, Complaint, Notice, RentTransaction, Staff
from schemas.auth_schemas import OwnerSignup, OwnerLogin, OTPVerify, TenantLogin, ForgotPassword, ResetPassword, ChangePassword
from repositories import AuthRepository, StaffRepository, TenantRepository
from email_service import send_otp_email
from datetime import datetime, timedelta, timezone
import random
from security import get_password_hash, verify_password, create_access_token

# In-memory store for pending (unverified) signups.
# Format: { email: { "hashed_password": str, "name": str, "otp": str, "otp_expiry": datetime } }
# A record is only moved to the DB after OTP is verified successfully.
_pending_signups: dict = {}

# In-memory store for password reset OTPs.
# Format: { email: { "otp": str, "expiry": datetime } }
_reset_otps: dict = {}

class AuthService:
    def __init__(self, auth_repo: AuthRepository, staff_repo: StaffRepository, tenant_repo: TenantRepository):
        self.auth_repo = auth_repo
        self.staff_repo = staff_repo
        self.tenant_repo = tenant_repo

    def owner_signup(self, signup_data: OwnerSignup) -> dict:
        email = signup_data.email.strip().lower()
        password = signup_data.password
        name = signup_data.name

        # Check if a fully verified account already exists in the database
        existing = self.auth_repo.get_owner_by_email(email)
        if existing and existing.is_verified:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered. Please log in instead, or use a different email."
            )

        # Generate OTP
        otp = f"{random.randint(100000, 999999)}"
        otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

        # Store signup details temporarily in memory — DO NOT write to DB yet
        _pending_signups[email] = {
            "hashed_password": get_password_hash(password),
            "name": name,
            "otp": otp,
            "otp_expiry": otp_expiry,
        }

        send_otp_email(email, otp, name)
        return {"status": "otp_pending", "email": email}


    def login(self, login_data: OwnerLogin) -> dict:
        owner = self.auth_repo.get_owner_by_email_and_password(login_data.email, login_data.password)
        if owner and verify_password(login_data.password, owner.password):
            access_token = create_access_token(data={"sub": str(owner.id), "role": "Owner"})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": owner.id, 
                    "name": owner.name, 
                    "email": owner.email, 
                    "role": "Owner",
                    "owner_id": owner.id,
                    "must_change_password": False
                }
            }
        
        staff = self.staff_repo.get_by_email_and_password(login_data.email, login_data.password)
        if staff and verify_password(login_data.password, staff.password):
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
                
            access_token = create_access_token(data={"sub": str(staff.owner_id), "role": staff.role, "staff_id": str(staff.id)})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": staff.id,
                    "name": staff.name,
                    "email": staff.email,
                    "role": staff.role,
                    "property_id": staff.property_id, # Keep primary for compatibility
                    "property_ids": prop_ids,
                    "property_names": staff.property_names.split(",") if staff.property_names else [],
                    "owner_id": staff.owner_id,
                    "must_change_password": staff.must_change_password
                }
            }
            
        raise HTTPException(status_code=401, detail="Invalid email or password")

    def verify_otp(self, verify_data: OTPVerify) -> dict:
        email = verify_data.email.strip().lower()
        pending = _pending_signups.get(email)

        if not pending:
            raise HTTPException(
                status_code=404,
                detail="No pending signup found for this email. Please sign up again."
            )

        if pending["otp"] != verify_data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP. Please check the code sent to your email.")

        if datetime.now(timezone.utc) > pending["otp_expiry"]:
            # Clean up expired pending entry
            _pending_signups.pop(email, None)
            raise HTTPException(status_code=400, detail="OTP expired. Please sign up again to receive a new code.")

        # OTP is valid — now permanently create the owner in the database
        owner = Owner(
            email=email,
            password=pending["hashed_password"],
            name=pending["name"],
            is_verified=True,
            otp=None,
            otp_expiry=None,
        )
        owner = self.auth_repo.create_owner(owner)

        # Remove from pending store
        _pending_signups.pop(email, None)

        # New owner starts with a clean empty dashboard — no dummy data seeded

        access_token = create_access_token(data={"sub": str(owner.id), "role": "Owner"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": owner.id,
                "name": owner.name,
                "email": owner.email
            }
        }

    def tenant_login(self, login_data: TenantLogin) -> dict:
        tenant = self.tenant_repo.get_by_email_and_password(login_data.email, login_data.password)

        if not tenant or not verify_password(login_data.password, tenant.password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password. Please check your credentials."
            )
            
        access_token = create_access_token(data={"sub": str(tenant.owner_id), "role": "Tenant", "tenant_id": str(tenant.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "id": tenant.id,
            "name": tenant.name,
            "must_change_password": tenant.must_change_password,
            "user": {
                "id": tenant.id,
                "name": tenant.name,
                "email": tenant.email,
                "property_id": tenant.property_id,
                "property_name": tenant.property_name,
                "role": "tenant",
                "must_change_password": tenant.must_change_password
            }
        }

    # ── Password management (change / forgot / reset) ──────────────────────

    def change_tenant_password(self, tenant: Tenant, data: ChangePassword) -> dict:
        if not verify_password(data.current_password, tenant.password):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        tenant.password = get_password_hash(data.new_password)
        tenant.must_change_password = False
        self.tenant_repo.update(tenant)
        return {"status": "success", "message": "Password updated successfully."}

    def change_staff_password(self, staff: Staff, data: ChangePassword) -> dict:
        if not verify_password(data.current_password, staff.password):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        staff.password = get_password_hash(data.new_password)
        staff.must_change_password = False
        self.staff_repo.update(staff)
        return {"status": "success", "message": "Password updated successfully."}

    def forgot_password_owner(self, email: str) -> dict:
        email = email.strip().lower()
        owner = self.auth_repo.get_owner_by_email(email)
        staff = self.staff_repo.get_by_email_and_password(email, "") if not owner else None
        if not owner and not staff:
            raise HTTPException(status_code=404, detail="No account found with this email.")
        name = owner.name if owner else staff.name
        return self._send_reset_otp(email, name)

    def reset_password_owner(self, data: ResetPassword) -> dict:
        email = data.email.strip().lower()
        self._validate_reset_otp(email, data.otp)
        owner = self.auth_repo.get_owner_by_email(email)
        staff = self.staff_repo.get_by_email_and_password(email, "") if not owner else None
        if not owner and not staff:
            raise HTTPException(status_code=404, detail="No account found with this email.")
        if owner:
            owner.password = get_password_hash(data.new_password)
            self.auth_repo.update_owner(owner)
        else:
            staff.password = get_password_hash(data.new_password)
            staff.must_change_password = False
            self.staff_repo.update(staff)
        return {"status": "success", "message": "Password reset successfully. Please log in with your new password."}

    def forgot_password_tenant(self, email: str) -> dict:
        email = email.strip().lower()
        tenant = self.tenant_repo.get_by_email_and_password(email, "")
        if not tenant:
            raise HTTPException(status_code=404, detail="No tenant account found with this email.")
        return self._send_reset_otp(email, tenant.name)

    def reset_password_tenant(self, data: ResetPassword) -> dict:
        email = data.email.strip().lower()
        self._validate_reset_otp(email, data.otp)
        tenant = self.tenant_repo.get_by_email_and_password(email, "")
        if not tenant:
            raise HTTPException(status_code=404, detail="No tenant account found with this email.")
        tenant.password = get_password_hash(data.new_password)
        tenant.must_change_password = False
        self.tenant_repo.update(tenant)
        return {"status": "success", "message": "Password reset successfully. Please log in with your new password."}

    def _send_reset_otp(self, email: str, name: str) -> dict:
        otp = f"{random.randint(100000, 999999)}"
        _reset_otps[email] = {
            "otp": otp,
            "expiry": datetime.now(timezone.utc) + timedelta(minutes=10),
        }
        send_otp_email(email, otp, name)
        return {"status": "otp_sent", "email": email}

    def _validate_reset_otp(self, email: str, otp: str):
        entry = _reset_otps.get(email)
        if not entry:
            raise HTTPException(status_code=400, detail="No reset request found. Please request a new code.")
        if entry["otp"] != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP. Please check the code sent to your email.")
        if datetime.now(timezone.utc) > entry["expiry"]:
            _reset_otps.pop(email, None)
            raise HTTPException(status_code=400, detail="OTP expired. Please request a new code.")
        _reset_otps.pop(email, None)

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
