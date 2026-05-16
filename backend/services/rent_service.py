# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\services\rent_service.py
from fastapi import HTTPException
from models import RentTransaction
from schemas.rent_schemas import RentTransactionCreate
from repositories import RentRepository, TenantRepository
from utils import add_one_month
from typing import List, Optional, Any

class RentService:
    def __init__(self, repo: RentRepository, tenant_repo: TenantRepository):
        self.repo = repo
        self.tenant_repo = tenant_repo

    def get_all(self, owner_id: Optional[int] = None, property_id: Optional[Any] = None) -> List[RentTransaction]:
        return self.repo.get_all(owner_id, property_id)

    def create(self, transaction_in: RentTransactionCreate) -> RentTransaction:
        transaction = RentTransaction(**transaction_in.dict())
        
        if transaction.tenant_id and (not transaction.property_name or not transaction.property_id):
            tenant = self.tenant_repo.get_by_id(transaction.tenant_id)
            if tenant:
                if not transaction.property_id:
                    transaction.property_id = tenant.property_id
                if not transaction.property_name:
                    transaction.property_name = tenant.property_name
                if not transaction.tenant_name:
                    transaction.tenant_name = tenant.name

        transaction = self.repo.create(transaction)

        if transaction.tenant_id:
            tenant = self.tenant_repo.get_by_id(transaction.tenant_id)
            if tenant:
                tenant.rent_status = "paid"
                if tenant.rent_due_date:
                    tenant.rent_due_date = add_one_month(tenant.rent_due_date)
                self.tenant_repo.update(tenant)

        return transaction
