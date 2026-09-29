from sqlmodel import create_engine, Session, SQLModel
import os
import logging
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger("database")

def init_engine():
    database_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    
    if database_url and (database_url.startswith("postgresql://") or database_url.startswith("postgres://")):
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        pg_engine = create_engine(
            database_url, 
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"options": "-c timezone=utc"}
        )
        try:
            with pg_engine.connect() as conn:
                logger.info("Successfully connected to Supabase PostgreSQL database.")
            return pg_engine
        except Exception as e:
            print("\n" + "="*70)
            print("WARNING: SUPABASE DATABASE CONNECTION FAILED")
            print(f"Error: {e}")
            print("\nREASON: Supabase free-tier projects automatically pause after 7 days of inactivity.")
            print("The domain host 'db.mhvjnpfpovfyqfoajctp.supabase.co' could not be resolved.")
            print("\nHOW TO FIX:")
            print("  1. Log into your Supabase Dashboard: https://supabase.com/dashboard")
            print("  2. Select project 'mhvjnpfpovfyqfoajctp' and click 'Restore project'.")
            print("  3. Once restored, restart backend server.")
            print("\nFALLING BACK TO LOCAL SQLITE DATABASE (database.db) FOR LOCAL DEV...")
            print("="*70 + "\n")

    # Local SQLite fallback
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(backend_dir, "database.db").replace("\\", "/")
    sqlite_url = f"sqlite:///{sqlite_path}"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = init_engine()

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session


