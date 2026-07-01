# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\notices.py
from fastapi import APIRouter, Depends, Query, HTTPException
from security import get_current_user
from models import Owner
from sqlmodel import Session
from database import get_session
from typing import List, Optional, Any
from schemas.notice_schemas import NoticeCreate, NoticeResponse
from models import Notice
from repositories import NoticeRepository, PropertyRepository
from routers.websocket import manager

router = APIRouter(prefix="/notices", tags=["notices"])

def get_notice_repo(session: Session = Depends(get_session)):
    return NoticeRepository(session)

def get_property_repo(session: Session = Depends(get_session)):
    return PropertyRepository(session)

@router.get("", response_model=List[NoticeResponse])
def get_notices(
    current_user: Owner = Depends(get_current_user), 
    property_id: Optional[Any] = Query(None), 
    repo: NoticeRepository = Depends(get_notice_repo)
):
    return repo.get_all(current_user.id, property_id)

@router.post("", response_model=NoticeResponse)
async def create_notice(
    notice_in: NoticeCreate, 
    repo: NoticeRepository = Depends(get_notice_repo),
    prop_repo: PropertyRepository = Depends(get_property_repo)
,
    current_user: Owner = Depends(get_current_user)
):
    notice_in.owner_id = current_user.id
    notice = Notice(**notice_in.dict())
    if not notice.property_name:
        prop = prop_repo.get_by_id(notice.property_id)
        if prop:
            notice.property_name = prop.name
            
    result = repo.create(notice)
    await manager.broadcast({"type": "data_updated", "entity": "notices"})
    await manager.broadcast({
        "type": "notification",
        "category": "notice_created",
        "title": "📢 New Notice Posted",
        "message": f"{notice.title} (Property: {notice.property_name or 'All'})",
        "property_id": notice.property_id,
        "property_name": notice.property_name,
        "notice_title": notice.title,
        "urgent": notice.urgent,
        "owner_id": notice.owner_id
    })
    return result

@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: int,
    notice_in: NoticeCreate,
    repo: NoticeRepository = Depends(get_notice_repo),
    prop_repo: PropertyRepository = Depends(get_property_repo),
    current_user: Owner = Depends(get_current_user)
):
    notice = repo.get_by_id(notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    if notice.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this notice")
        
    notice.title = notice_in.title
    notice.content = notice_in.content
    notice.property_id = notice_in.property_id
    notice.urgent = notice_in.urgent
    
    if notice_in.property_id == 0:
        notice.property_name = "All Properties"
    else:
        prop = prop_repo.get_by_id(notice_in.property_id)
        if prop:
            notice.property_name = prop.name
            
    result = repo.update(notice)
    await manager.broadcast({"type": "data_updated", "entity": "notices"})
    return result

@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: int,
    repo: NoticeRepository = Depends(get_notice_repo),
    current_user: Owner = Depends(get_current_user)
):
    notice = repo.get_by_id(notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    if notice.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this notice")
        
    repo.delete(notice)
    await manager.broadcast({"type": "data_updated", "entity": "notices"})
    return {"status": "success", "message": "Notice deleted successfully"}
