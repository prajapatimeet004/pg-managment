from sqlmodel import Session, select
from database import engine
from models import Owner
from datetime import datetime

with Session(engine) as session:
    owners = session.exec(select(Owner)).all()
    print(f"Server Current Time (UTC): {datetime.utcnow()}")
    for o in owners:
        print(f"Email: {o.email} | OTP: {o.otp} | Expiry: {o.otp_expiry} | Verified: {o.is_verified}")
        if o.otp_expiry:
             print(f"Expired? {o.otp_expiry < datetime.utcnow()}")
