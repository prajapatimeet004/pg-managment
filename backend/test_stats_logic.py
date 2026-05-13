from main import get_stats
from database import engine
from sqlmodel import Session
import json

def test_stats():
    with Session(engine) as session:
        print("Testing get_stats for owner_id=1...")
        try:
            stats = get_stats(owner_id=1, session=session)
            print(f"Stats for ID 1: {json.dumps(stats, indent=2)}")
        except Exception as e:
            print(f"Error for ID 1: {e}")
            
        print("\nTesting get_stats for owner_id=4...")
        try:
            stats = get_stats(owner_id=4, session=session)
            print(f"Stats for ID 4: {json.dumps(stats, indent=2)}")
        except Exception as e:
            print(f"Error for ID 4: {e}")

        print("\nTesting get_stats for owner_id=None...")
        try:
            stats = get_stats(owner_id=None, session=session)
            print(f"Global Stats: {json.dumps(stats, indent=2)}")
        except Exception as e:
            print(f"Error for Global: {e}")

if __name__ == "__main__":
    test_stats()
