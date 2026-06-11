from sqlmodel import Session, select
from database import engine
from models import Tenant

with Session(engine) as session:
    tenant = session.exec(select(Tenant).where(Tenant.name == "lal")).first()
    if tenant:
        print(f"Found tenant: {tenant.name} with current status: {tenant.rent_status}")
        tenant.rent_status = "due"
        session.add(tenant)
        session.commit()
        print(f"Updated tenant {tenant.name} rent status to 'due'.")
    else:
        print("Tenant 'lal' not found in database.")
