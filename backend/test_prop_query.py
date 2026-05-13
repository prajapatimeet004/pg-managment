from sqlmodel import Session, select
from database import engine
from models import Property
import time

def test_query():
    print("Starting query test...")
    start = time.time()
    try:
        with Session(engine) as session:
            print("Executing select(Property)...")
            results = session.exec(select(Property)).all()
            print(f"Fetched {len(results)} properties in {time.time() - start:.2f}s")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_query()
