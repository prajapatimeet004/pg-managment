from datetime import datetime, date
from sqlmodel import Session, select
from database import engine
from models import Tenant
import logging

logger = logging.getLogger("backend.rent_scheduler")

def check_and_update_rent_statuses():
    logger.info("Running scheduled rent status check...")
    today = date.today()
    updated_count = 0

    try:
        with Session(engine) as session:
            tenants = session.exec(
                select(Tenant).where(Tenant.is_active == True)
            ).all()

            for tenant in tenants:
                if tenant.rent_status == "paid":
                    continue

                due_date = None
                raw = tenant.rent_due_date
                if raw:
                    try:
                        due_date = datetime.strptime(raw, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass

                if due_date and due_date < today:
                    tenant.rent_status = "overdue"
                    session.add(tenant)
                    updated_count += 1
                    logger.info(
                        "Marked tenant %s (id=%d) overdue — due %s",
                        tenant.name, tenant.id, raw,
                    )

            if updated_count:
                session.commit()
                logger.info("Updated %d tenant(s) to overdue", updated_count)
            else:
                logger.info("No overdue tenants found")
    except Exception:
        logger.exception("Rent status check failed")
