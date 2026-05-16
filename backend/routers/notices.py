# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\notices.py
from fastapi import APIRouter, Depends, Query
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
    owner_id: Optional[int] = Query(None), 
    property_id: Optional[Any] = Query(None), 
    repo: NoticeRepository = Depends(get_notice_repo)
):
    return repo.get_all(owner_id, property_id)

@router.post("", response_model=NoticeResponse)
async def create_notice(
    notice_in: NoticeCreate, 
    repo: NoticeRepository = Depends(get_notice_repo),
    prop_repo: PropertyRepository = Depends(get_property_repo)
):
    notice = Notice(**notice_in.dict())
    if not notice.property_name:
        prop = prop_repo.get_by_id(notice.property_id)
        if prop:
            notice.property_name = prop.name
            
    result = repo.create(notice)
    await manager.broadcast({"type": "data_updated", "entity": "notices"})
    return result
