# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\tenant_service.py
from fastapi import HTTPException
from models import Tenant
from schemas.tenant_schemas import TenantCreate, TenantUpdate, TenantTransfer
from repositories import TenantRepository, PropertyRepository, RoomRepository
from utils import add_one_month
from typing import List, Optional

class TenantService:
    def __init__(self, repo: TenantRepository, property_repo: PropertyRepository, room_repo: RoomRepository):
        self.repo = repo
        self.property_repo = property_repo
        self.room_repo = room_repo

    def get_all(self, search: Optional[str] = None, owner_id: Optional[int] = None, property_id: Optional[int] = None) -> List[Tenant]:
        tenants = self.repo.get_active(owner_id, property_id)
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

    def create(self, tenant_in: TenantCreate) -> Tenant:
        # Check if bed is already occupied
        existing_tenant = self.repo.get_by_bed(tenant_in.property_id, tenant_in.room_number, tenant_in.bed_number)
        if existing_tenant:
            raise HTTPException(
                status_code=400, 
                detail=f"Bed {tenant_in.bed_number} in room {tenant_in.room_number} is already occupied by {existing_tenant.name}"
            )

        tenant = Tenant(**tenant_in.dict())
        if not tenant.property_name:
            prop = self.property_repo.get_by_id(tenant.property_id)
            if prop:
                tenant.property_name = prop.name
        
        if tenant.join_date:
            tenant.rent_due_date = add_one_month(tenant.join_date)

        tenant = self.repo.create(tenant)

        # Sync room
        room = self.room_repo.get_by_property_and_room_number(tenant.property_id, tenant.room_number)
        if room:
            room.occupied_beds = min(room.occupied_beds + 1, room.total_beds)
            room.status = "full" if room.occupied_beds >= room.total_beds else "partial" if room.occupied_beds > 0 else "available"
            self.room_repo.update(room)

        # Sync property
        prop = self.property_repo.get_by_id(tenant.property_id)
        if prop:
            prop.occupied_beds = min(prop.occupied_beds + 1, prop.total_beds)
            prop.monthly_revenue += tenant.rent_amount
            self.property_repo.update(prop)

        return tenant

    def transfer(self, tenant_id: int, request: TenantTransfer, owner_id: Optional[int] = None) -> Tenant:
        tenant = self.repo.get_by_id(tenant_id)
        if not tenant or (owner_id and tenant.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Tenant not found")

        old_prop_id = tenant.property_id
        old_room_num = tenant.room_number

        # Update old room
        old_room = self.room_repo.get_by_property_and_room_number(old_prop_id, old_room_num)
        if old_room:
            old_room.occupied_beds = max(0, old_room.occupied_beds - 1)
            old_room.status = "full" if old_room.occupied_beds >= old_room.total_beds else "partial" if old_room.occupied_beds > 0 else "available"
            self.room_repo.update(old_room)

        # Update old prop
        old_prop = self.property_repo.get_by_id(old_prop_id)
        if old_prop:
            old_prop.occupied_beds = max(0, old_prop.occupied_beds - 1)
            old_prop.monthly_revenue = max(0, old_prop.monthly_revenue - tenant.rent_amount)
            self.property_repo.update(old_prop)

        # Apply transfer
        new_prop = self.property_repo.get_by_id(request.property_id)
        if not new_prop:
            raise HTTPException(status_code=404, detail="New property not found")

        # Check if new bed is occupied
        existing_tenant = self.repo.get_by_bed(request.property_id, request.room_number, request.bed_number)
        if existing_tenant and existing_tenant.id != tenant_id:
            raise HTTPException(
                status_code=400, 
                detail=f"Bed {request.bed_number} in room {request.room_number} is already occupied by {existing_tenant.name}"
            )

        tenant.property_id = request.property_id
        tenant.property_name = new_prop.name
        tenant.room_number = request.room_number
        tenant.bed_number = request.bed_number
        tenant = self.repo.update(tenant)

        # Update new room
        new_room = self.room_repo.get_by_property_and_room_number(request.property_id, request.room_number)
        if new_room:
            new_room.occupied_beds = min(new_room.occupied_beds + 1, new_room.total_beds)
            new_room.status = "full" if new_room.occupied_beds >= new_room.total_beds else "partial" if new_room.occupied_beds > 0 else "available"
            self.room_repo.update(new_room)

        # Update new prop
        new_prop.occupied_beds = min(new_prop.occupied_beds + 1, new_prop.total_beds)
        new_prop.monthly_revenue += tenant.rent_amount
        self.property_repo.update(new_prop)

        return tenant

    def update(self, tenant_id: int, data: TenantUpdate, owner_id: Optional[int] = None) -> Tenant:
        tenant = self.repo.get_by_id(tenant_id)
        if not tenant or (owner_id and tenant.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        old_rent = tenant.rent_amount
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(tenant, key, value)
        
        new_rent = tenant.rent_amount
        if old_rent != new_rent:
            prop = self.property_repo.get_by_id(tenant.property_id)
            if prop:
                prop.monthly_revenue = prop.monthly_revenue - old_rent + new_rent
                self.property_repo.update(prop)
                
        return self.repo.update(tenant)

    def delete(self, tenant_id: int, owner_id: Optional[int] = None) -> str:
        tenant = self.repo.get_by_id(tenant_id)
        if not tenant or (owner_id and tenant.owner_id != owner_id):
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        prop_id = tenant.property_id
        room_num = tenant.room_number
        rent = tenant.rent_amount

        room = self.room_repo.get_by_property_and_room_number(prop_id, room_num)
        if room:
            room.occupied_beds = max(0, room.occupied_beds - 1)
            room.status = "available" if room.occupied_beds == 0 else "partial"
            self.room_repo.update(room)
        
        prop = self.property_repo.get_by_id(prop_id)
        if prop:
            prop.occupied_beds = max(0, prop.occupied_beds - 1)
            prop.monthly_revenue = max(0, prop.monthly_revenue - rent)
            self.property_repo.update(prop)

        tenant.is_active = False
        self.repo.update(tenant)
        return "Tenant deleted successfully"
