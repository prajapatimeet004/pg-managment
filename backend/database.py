from sqlmodel import create_engine, Session, SQLModel
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
# Priority: SUPABASE_DATABASE_URL or LOCAL_DATABASE_URL or sqlite fallback
database_url = os.getenv("SUPABASE_DATABASE_URL")

if not database_url:
    # Check for local postgres if supabase not provided
    database_url = os.getenv("LOCAL_DATABASE_URL")

if not database_url:
    # Default to SQLite for basic local dev if no PG provided
    sqlite_file_name = "database.db"
    database_url = f"sqlite:///backend/{sqlite_file_name}"
    print("Warning: SUPABASE_DATABASE_URL not found. Falling back to SQLite.")

# Use create_engine with appropriate args for SQLite vs Postgres
if database_url.startswith("sqlite"):
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    # Postgres specific settings (like SSL for Supabase)
    engine = create_engine(
        database_url, 
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"options": "-c timezone=utc"}
    )

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
