# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\property_service.py
from fastapi import HTTPException
from models import Property, Room
from schemas.property_schemas import PropertyCreate, PropertyUpdate
from repositories import (
    PropertyRepository, RoomRepository, TenantRepository, ComplaintRepository, 
    NoticeRepository, StaffRepository, RentRepository
)
from typing import List, Optional, Any

class PropertyService:
    def __init__(
        self, 
        repo: PropertyRepository,
        room_repo: RoomRepository,
        tenant_repo: TenantRepository,
        complaint_repo: ComplaintRepository,
        notice_repo: NoticeRepository,
        staff_repo: StaffRepository,
        rent_repo: RentRepository
    ):
        self.repo = repo
        self.room_repo = room_repo
        self.tenant_repo = tenant_repo
        self.complaint_repo = complaint_repo
        self.notice_repo = notice_repo
        self.staff_repo = staff_repo
        self.rent_repo = rent_repo

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[Any]:
        properties = self.repo.get_all(owner_id, property_id)
        # Fetch staff members to resolve manager names
        staff_members = self.staff_repo.get_all(owner_id=owner_id)
        
        # Build mapping from property_id to staff manager name(s)
        prop_managers = {}
        for s in staff_members:
            if s.role in ("Property Manager", "Manager") and s.status == "Active":
                s_pids = []
                if s.property_ids:
                    import re
                    s_pids = [int(i) for i in re.findall(r"\d+", s.property_ids) if i]
                elif s.property_id:
                    s_pids = [s.property_id]
                
                for pid in s_pids:
                    if pid not in prop_managers:
                        prop_managers[pid] = []
                    if s.name not in prop_managers[pid]:
                        prop_managers[pid].append(s.name)
        
        result = []
        for prop in properties:
            prop_dict = prop.model_dump()
            resolved_mgr = prop_managers.get(prop.id)
            if resolved_mgr:
                # Only show the primary (first) manager name on cards
                prop_dict["manager"] = resolved_mgr[0]
            result.append(prop_dict)
        return result

    def get_by_id(self, property_id: int, owner_id: Optional[int] = None) -> dict:
        prop = self.repo.get_by_id(property_id)
        if not prop or (owner_id and prop.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Property not found")
        
        rooms = self.room_repo.get_all(property_id=property_id)
        tenants = self.tenant_repo.get_all(property_id=property_id)
        complaints = self.complaint_repo.get_all(property_id=property_id)

        # Dynamically sync rooms and tenants
        for r in rooms:
            room_tenants = [t for t in tenants if t.room_number == r.room_number]
            
            # Self-healing: Fix double-booked beds
            bed_map = {}
            for t in room_tenants:
                if t.bed_number in bed_map:
                    # Double booking found! Find an available bed letter
                    all_beds = [chr(65 + i) for i in range(r.total_beds)]
                    taken_beds = {tn.bed_number for tn in room_tenants}
                    avail = [b for b in all_beds if b not in taken_beds]
                    if avail:
                        t.bed_number = avail[0]
                        self.tenant_repo.update(t)
                        # No need to update room_tenants list for count, but update taken_beds
                        taken_beds.add(t.bed_number)
                else:
                    bed_map[t.bed_number] = t

            active_count = len(room_tenants)
            if r.occupied_beds != active_count:
                r.occupied_beds = active_count
                r.status = "full" if r.occupied_beds >= r.total_beds else "partial" if r.occupied_beds > 0 else "available"
                self.room_repo.update(r)

        # Resolve manager name + fetch ALL staff assigned to this property
        import re as _re
        all_staff = self.staff_repo.get_all(owner_id=owner_id)
        resolved_mgrs = []
        property_staff = []
        for s in all_staff:
            s_pids = []
            if s.property_ids:
                s_pids = [int(i) for i in _re.findall(r"\d+", s.property_ids) if i]
            elif s.property_id:
                s_pids = [s.property_id]
            if property_id in s_pids:
                # Build a staff dict for the frontend
                property_staff.append({
                    "id": s.id,
                    "name": s.name,
                    "role": s.role,
                    "email": s.email,
                    "phone": s.phone,
                    "status": s.status,
                    "shift": s.shift,
                })
                if s.role in ("Property Manager", "Manager") and s.status == "Active":
                    if s.name not in resolved_mgrs:
                        resolved_mgrs.append(s.name)

        # Primary manager name (first active PM, or fallback to stored value)
        manager_name = resolved_mgrs[0] if resolved_mgrs else prop.manager

        return {
            "id": prop.id,
            "name": prop.name,
            "address": prop.address,
            "total_rooms": prop.total_rooms,
            "total_beds": prop.total_beds,
            "occupied_beds": prop.occupied_beds,
            "monthly_revenue": prop.monthly_revenue,
            "manager": manager_name,
            "phone": prop.phone,
            "owner_id": prop.owner_id,
            "rooms": rooms,
            "tenants": tenants,
            "complaints": complaints,
            "staff": property_staff,
        }

    def create(self, prop_in: PropertyCreate) -> dict:
        total_rooms = sum(len(floor.rooms) for floor in prop_in.floors)
        total_beds = sum(room.beds for floor in prop_in.floors for room in floor.rooms)

        db_prop = Property(
            name=prop_in.name,
            address=prop_in.address,
            manager=prop_in.manager,
            phone=prop_in.phone,
            total_rooms=total_rooms,
            total_beds=total_beds,
            occupied_beds=0,
            monthly_revenue=0.0,
            owner_id=prop_in.owner_id
        )
        db_prop = self.repo.create(db_prop)

        for floor_idx, floor_cfg in enumerate(prop_in.floors):
            floor_number = floor_idx + 1
            for room_idx, room_cfg in enumerate(floor_cfg.rooms):
                room_number = f"{floor_number}{room_idx + 1:02d}"
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
                    status="available",
                    owner_id=db_prop.owner_id
                )
                self.room_repo.create(new_room)

        return {
            "id": db_prop.id,
            "name": db_prop.name,
            "address": db_prop.address,
            "manager": db_prop.manager,
            "phone": db_prop.phone,
            "total_rooms": db_prop.total_rooms,
            "total_beds": db_prop.total_beds,
            "occupied_beds": db_prop.occupied_beds,
            "monthly_revenue": db_prop.monthly_revenue,
            "owner_id": db_prop.owner_id,
        }

    def update(self, property_id: int, prop_in: PropertyUpdate, owner_id: Optional[int] = None) -> Property:
        prop = self.repo.get_by_id(property_id)
        if not prop or (owner_id and prop.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Property not found")
        
        update_data = prop_in.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(prop, key, value)
        
        return self.repo.update(prop)

    def delete(self, property_id: int, owner_id: Optional[int] = None) -> str:
        prop = self.repo.get_by_id(property_id)
        if not prop or (owner_id and prop.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Property not found")

        # Manually cascade deletes
        for room in self.room_repo.get_all(property_id=property_id):
            self.room_repo.session.delete(room)
        for tenant in self.tenant_repo.get_all(property_id=property_id):
            self.tenant_repo.session.delete(tenant)
        for complaint in self.complaint_repo.get_all(property_id=property_id):
            self.complaint_repo.session.delete(complaint)
        for notice in self.notice_repo.get_all(property_id=property_id):
            self.notice_repo.session.delete(notice)
        
        # Staff by property_id is not directly supported in staff_repo by default, so query manually or update repo
        # To avoid adding new repo methods if not needed, we can do it via session:
        from models import Staff, RentTransaction
        from sqlmodel import delete
        self.repo.session.exec(delete(Staff).where(Staff.property_id == property_id))
        self.repo.session.exec(delete(RentTransaction).where(RentTransaction.property_name == prop.name))
        
        self.repo.delete(prop)
        return f"Property '{prop.name}' and all associated data deleted successfully"
