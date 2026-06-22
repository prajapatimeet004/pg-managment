from sqlmodel import create_engine, Session, SQLModel
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Database Configuration
# Priority: SUPABASE_DATABASE_URL or LOCAL_DATABASE_URL or sqlite fallback
database_url = os.getenv("SUPABASE_DATABASE_URL")

if not database_url:
    # Check for local postgres if supabase not provided
    database_url = os.getenv("LOCAL_DATABASE_URL")

# If database_url is empty, or is an HTTP/HTTPS url (like Supabase API URL instead of postgres:// connection string)
if not database_url or database_url.startswith("http"):
    # Default to SQLite for basic local dev if no PG provided
    # Force absolute path relative to this file so database is shared regardless of execution CWD
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(backend_dir, "database.db").replace("\\", "/")
    database_url = f"sqlite:///{sqlite_path}"
    print(f"Warning: SUPABASE_DATABASE_URL is not configured or is set to an API URL. Falling back to SQLite at: {sqlite_path}")

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
