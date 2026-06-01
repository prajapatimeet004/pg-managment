# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\stats_service.py
from repositories import PropertyRepository, TenantRepository, ComplaintRepository
from typing import Optional, Any

class StatsService:
    def __init__(self, property_repo: PropertyRepository, tenant_repo: TenantRepository, complaint_repo: ComplaintRepository, staff_repo: Any = None):
        self.property_repo = property_repo
        self.tenant_repo = tenant_repo
        self.complaint_repo = complaint_repo
        self.staff_repo = staff_repo

    def get_stats(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> dict:
        properties = self.property_repo.get_all(owner_id, property_id)
        tenants = self.tenant_repo.get_active(owner_id, property_id)
        complaints = self.complaint_repo.get_all(owner_id, property_id)
        staff = []
        if self.staff_repo:
            staff = self.staff_repo.get_all(owner_id, property_id)

        total_beds = sum(p.total_beds for p in properties)
        occupied_beds = len(tenants)
        monthly_revenue = sum(t.rent_amount for t in tenants)

        return {
            "total_properties": len(properties),
            "total_tenants": len(tenants),
            "occupancy_rate": round((occupied_beds / total_beds * 100)) if total_beds > 0 else 0,
            "monthly_revenue": monthly_revenue,
            "overdue_rents": len([t for t in tenants if t.rent_status == "overdue"]),
            "due_rents": len([t for t in tenants if t.rent_status == "due"]),
            "open_complaints": len([c for c in complaints if c.status in ["open", "in-progress"]]),
            "total_staff": len(staff)
        }
