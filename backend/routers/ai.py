# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers\ai.py
from fastapi import APIRouter, Depends, Query
from security import get_current_user
from models import Owner
from sqlmodel import Session
from database import get_session
from typing import Optional
from schemas.ai_schemas import AIChatRequest, AIAgentRequest, AIInsightResponse, AIBroadcastRequest
from repositories import PropertyRepository, TenantRepository, ComplaintRepository, RoomRepository, NoticeRepository, RentRepository
from services.ai_service import AIService
from services.stats_service import StatsService

router = APIRouter(prefix="/ai", tags=["ai"])

def get_ai_service(session: Session = Depends(get_session)):
    property_repo = PropertyRepository(session)
    tenant_repo = TenantRepository(session)
    complaint_repo = ComplaintRepository(session)
    room_repo = RoomRepository(session)
    notice_repo = NoticeRepository(session)
    rent_repo = RentRepository(session)
    stats_service = StatsService(property_repo, tenant_repo, complaint_repo)
    
    return AIService(
        property_repo,
        tenant_repo,
        complaint_repo,
        room_repo,
        notice_repo,
        rent_repo,
        stats_service
    )

@router.get("/insight", response_model=AIInsightResponse)
def get_property_ai_insight(
    current_user: Owner = Depends(get_current_user), 
    service: AIService = Depends(get_ai_service)
):
    return {"insight": service.get_insight(current_user.id)}

@router.post("/chat")
def post_chat(
    request: AIChatRequest, 
    service: AIService = Depends(get_ai_service)
):
    return {"response": service.process_chat(request.message)}

@router.post("/agent")
def ai_agent_endpoint(
    request: AIAgentRequest, 
    current_user: Owner = Depends(get_current_user), 
    property_id: Optional[int] = Query(None), 
    service: AIService = Depends(get_ai_service)
):
    return service.process_agent(request, current_user.id, property_id)

@router.post("/send-rent-reminders")
def send_rent_reminders(
    current_user: Owner = Depends(get_current_user), 
    service: AIService = Depends(get_ai_service)
):
    return service.send_rent_reminders(current_user.id)

@router.post("/property-analysis")
def property_analysis(
    current_user: Owner = Depends(get_current_user), 
    service: AIService = Depends(get_ai_service)
):
    return service.property_analysis(current_user.id)

@router.get("/tenant-search/{property_id}")
def search_tenants_in_property(
    property_id: int, 
    service: AIService = Depends(get_ai_service)
):
    return service.search_tenants(property_id)

@router.post("/broadcast-notice")
async def broadcast_notice(
    request: AIBroadcastRequest, 
    service: AIService = Depends(get_ai_service)
):
    return service.broadcast_notice(request)
