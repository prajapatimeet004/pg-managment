# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\ai_service.py
from fastapi import HTTPException
from models import Notice
from repositories import PropertyRepository, TenantRepository, ComplaintRepository, RoomRepository, NoticeRepository, RentRepository
from schemas.ai_schemas import AIAgentRequest, AIBroadcastRequest
from services.stats_service import StatsService
from ai_service import get_ai_insight as root_get_ai_insight
from ai_service import process_chat as root_process_chat
from ai_service import process_ai_agent as root_process_ai_agent
from messaging_service import send_dual_reminder
from typing import Optional

class AIService:
    def __init__(
        self,
        property_repo: PropertyRepository,
        tenant_repo: TenantRepository,
        complaint_repo: ComplaintRepository,
        room_repo: RoomRepository,
        notice_repo: NoticeRepository,
        rent_repo: RentRepository,
        stats_service: StatsService
    ):
        self.property_repo = property_repo
        self.tenant_repo = tenant_repo
        self.complaint_repo = complaint_repo
        self.room_repo = room_repo
        self.notice_repo = notice_repo
        self.rent_repo = rent_repo
        self.stats_service = stats_service

    def get_insight(self, owner_id: Optional[int] = None) -> str:
        stats = self.stats_service.get_stats(owner_id)
        return root_get_ai_insight(stats)

    def process_chat(self, message: str) -> str:
        return root_process_chat(message, [])

    def process_agent(self, request: AIAgentRequest, owner_id: Optional[int] = None, property_id: Optional[int] = None) -> str:
        properties = self.property_repo.get_all(owner_id, property_id)
        tenants = self.tenant_repo.get_all(owner_id, property_id)
        complaints = self.complaint_repo.get_all(owner_id, property_id)
        
        total_beds = sum(p.total_beds for p in properties)
        occupied_beds = sum(p.occupied_beds for p in properties)
        monthly_revenue = sum(p.monthly_revenue for p in properties)

        data_context = {
            "total_properties": len(properties),
            "total_tenants": len(tenants),
            "occupancy_rate": round((occupied_beds / total_beds * 100)) if total_beds > 0 else 0,
            "monthly_revenue": monthly_revenue,
            "overdue_rents": len([t for t in tenants if t.rent_status == "overdue"]),
            "open_complaints": len([c for c in complaints if c.status in ["open", "in-progress"]]),
            "properties": [
                {"id": p.id, "name": p.name, "address": p.address, "total_rooms": p.total_rooms,
                 "total_beds": p.total_beds, "occupied_beds": p.occupied_beds,
                 "monthly_revenue": p.monthly_revenue, "manager": p.manager}
                for p in properties
            ],
            "tenants_summary": [
                {"id": t.id, "name": t.name, "property": t.property_name,
                 "room": t.room_number, "bed": t.bed_number,
                 "rent_status": t.rent_status, "rent_amount": t.rent_amount,
                 "phone": t.phone, "email": t.email}
                for t in tenants
            ],
            "overdue_tenants": [
                {"id": t.id, "name": t.name, "property": t.property_name,
                 "rent_amount": t.rent_amount, "phone": t.phone, "email": t.email}
                for t in tenants if t.rent_status == "overdue"
            ],
            "open_complaints_list": [
                {"id": c.id, "tenant": c.tenant_name, "title": c.title,
                 "category": c.category, "priority": c.priority, "status": c.status}
                for c in complaints if c.status in ["open", "in-progress"]
            ]
        }
        return root_process_ai_agent(request.message, data_context, request.history)

    def send_rent_reminders(self, owner_id: Optional[int] = None) -> dict:
        tenants = self.tenant_repo.get_all(owner_id)
        overdue_tenants = [t for t in tenants if t.rent_status in ["overdue", "due"]]

        reminders_sent = []
        for tenant in overdue_tenants:
            message_body = f"Dear {tenant.name}, this is a reminder that your rent of ₹{tenant.rent_amount} for {tenant.property_name} is due on {tenant.rent_due_date}. Please arrange payment at your earliest convenience."
            
            notice = Notice(
                title="Rent Payment Reminder",
                content=message_body,
                property_id=tenant.property_id,
                property_name=tenant.property_name,
                created_by="AI Agent",
                urgent=True if tenant.rent_status == "overdue" else False
            )
            self.notice_repo.create(notice)
            
            if tenant.phone:
                send_dual_reminder(tenant.phone, message_body)
                
            reminders_sent.append(tenant.name)

        return {
            "status": "success",
            "message": f"Reminders sent to {len(reminders_sent)} tenants",
            "tenants": reminders_sent
        }

    def property_analysis(self, owner_id: Optional[int] = None) -> dict:
        properties = self.property_repo.get_all(owner_id)
        analysis = []
        for prop in properties:
            occupancy = (prop.occupied_beds / prop.total_beds * 100) if prop.total_beds > 0 else 0
            analysis.append({
                "property": prop.name,
                "occupancy_rate": round(occupancy, 2),
                "monthly_revenue": prop.monthly_revenue,
                "manager": prop.manager
            })
        return {"analysis": analysis}

    def search_tenants(self, property_id: int) -> dict:
        tenants = self.tenant_repo.get_all(property_id=property_id)
        return {"property_id": property_id, "tenants": tenants}

    def broadcast_notice(self, request: AIBroadcastRequest) -> dict:
        prop = self.property_repo.get_by_id(request.property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
            
        tenants = self.tenant_repo.get_all(property_id=request.property_id)
        
        delivery_count = 0
        for tenant in tenants:
            if tenant.phone:
                send_dual_reminder(tenant.phone, f"*{request.title}*\n\n{request.content}")
                delivery_count += 1
                
        db_notice = Notice(
            title=request.title,
            content=request.content,
            property_id=request.property_id,
            property_name=prop.name,
            created_by="AI Agent (Broadcast)"
        )
        self.notice_repo.create(db_notice)
        
        return {"status": "success", "delivered_to": delivery_count, "total_tenants": len(tenants)}
