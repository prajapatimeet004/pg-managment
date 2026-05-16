# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\staff.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session
from database import get_session
from typing import List, Optional
from schemas.staff_schemas import StaffCreate, StaffUpdate, StaffResponse
from models import Staff
from repositories import StaffRepository, PropertyRepository
from routers.websocket import manager

router = APIRouter(prefix="/staff", tags=["staff"])

def get_staff_repo(session: Session = Depends(get_session)):
    return StaffRepository(session)

def get_property_repo(session: Session = Depends(get_session)):
    return PropertyRepository(session)

@router.get("", response_model=List[StaffResponse])
def get_staff(
    owner_id: Optional[int] = Query(None), 
    repo: StaffRepository = Depends(get_staff_repo)
):
    staff_list = repo.get_all(owner_id)
    return [StaffResponse(**s.model_dump()) for s in staff_list]

@router.post("", response_model=StaffResponse)
async def create_staff(
    staff_in: StaffCreate, 
    repo: StaffRepository = Depends(get_staff_repo),
    prop_repo: PropertyRepository = Depends(get_property_repo)
):
    staff_data = staff_in.dict()
    
    # Handle multiple properties
    prop_ids = staff_data.get("property_ids")
    if prop_ids:
        staff_data["property_ids"] = ",".join(map(str, prop_ids))
        names = []
        for pid in prop_ids:
            p = prop_repo.get_by_id(pid)
            if p:
                names.append(p.name)
        staff_data["property_names"] = ",".join(names)
        # Set primary for backward compatibility
        if prop_ids and not staff_data.get("property_id"):
            staff_data["property_id"] = prop_ids[0]
            staff_data["property_name"] = names[0] if names else None
    
    staff = Staff(**staff_data)
    result = repo.create(staff)
    
    await manager.broadcast({"type": "data_updated", "entity": "staff"})
    return StaffResponse(**result.model_dump())

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int, 
    staff_in: StaffUpdate, 
    owner_id: Optional[int] = Query(None), 
    repo: StaffRepository = Depends(get_staff_repo),
    prop_repo: PropertyRepository = Depends(get_property_repo)
):
    db_staff = repo.get_by_id(staff_id)
    if not db_staff or (owner_id and db_staff.owner_id != owner_id):
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    update_data = staff_in.dict(exclude_unset=True)
    
    # Handle multiple properties update
    if "property_ids" in update_data and update_data["property_ids"] is not None:
        prop_ids = update_data["property_ids"]
        update_data["property_ids"] = ",".join(map(str, prop_ids))
        names = []
        for pid in prop_ids:
            p = prop_repo.get_by_id(pid)
            if p:
                names.append(p.name)
        update_data["property_names"] = ",".join(names)
        
        # Sync primary fields
        if prop_ids:
            update_data["property_id"] = prop_ids[0]
            update_data["property_name"] = names[0] if names else None
        else:
            update_data["property_id"] = None
            update_data["property_name"] = None

    for key, value in update_data.items():
        setattr(db_staff, key, value)
        
    result = repo.update(db_staff)
    
    await manager.broadcast({"type": "data_updated", "entity": "staff"})
    return StaffResponse(**result.model_dump())

@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: int, 
    repo: StaffRepository = Depends(get_staff_repo)
):
    db_staff = repo.get_by_id(staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    repo.delete(db_staff)
    await manager.broadcast({"type": "data_updated", "entity": "staff"})
    return {"message": "Staff member deleted successfully"}
