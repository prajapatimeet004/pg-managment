# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables, get_session
from routers import (
    properties, tenants, rooms, complaints, notices, rent, 
    staff, auth, ai, websocket, stats
)
from sqlmodel import Session
from database import engine
import logging

app = FastAPI(title="AI PG Management API")

logger = logging.getLogger("backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(tenants.router)
app.include_router(rooms.router)
app.include_router(complaints.router)
app.include_router(notices.router)
app.include_router(rent.router)
app.include_router(staff.router)
app.include_router(ai.router)
app.include_router(websocket.router)
app.include_router(stats.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API is running"}

@app.on_event("startup")
def on_startup():
    try:
        create_db_and_tables()
        # Call seed data from auth service
        with Session(engine) as session:
            from repositories.auth_repo import AuthRepository
            from repositories.staff_repo import StaffRepository
            from repositories.tenant_repo import TenantRepository
            from services.auth_service import AuthService

            auth_repo = AuthRepository(session)
            staff_repo = StaffRepository(session)
            tenant_repo = TenantRepository(session)

            auth_service = AuthService(auth_repo, staff_repo, tenant_repo)
            auth_service.seed_data()
    except Exception:
        # Log the exception but do not re-raise so the server can bind to the port.
        logger.exception("Startup error - DB initialization or seed failed")
