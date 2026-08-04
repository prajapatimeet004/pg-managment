from sqlmodel import create_engine, Session, SQLModel
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Database Configuration: Strictly require Supabase PostgreSQL
database_url = os.getenv("SUPABASE_DATABASE_URL")

if not database_url or not (database_url.startswith("postgresql://") or database_url.startswith("postgres://")):
    raise RuntimeError(
        "CRITICAL ERROR: SUPABASE_DATABASE_URL is not configured or invalid in .env! "
        "Please provide a valid PostgreSQL connection string from Supabase."
    )

# Standardize postgres:// to postgresql:// for SQLAlchemy
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine for Supabase PostgreSQL
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

