from sqlmodel import Session
from database import engine
from repositories import PropertyRepository, TenantRepository, ComplaintRepository, StaffRepository
from services.stats_service import StatsService

def check_stats():
    with Session(engine) as session:
        service = StatsService(
            PropertyRepository(session),
            TenantRepository(session),
            ComplaintRepository(session),
            StaffRepository(session)
        )
        
        # Test multi-property stats
        stats = service.get_stats(owner_id=2, property_id="13,19")
        print(f"Stats for Owner 2, Props 13,19: {stats}")
        
        # Check properties directly
        props = PropertyRepository(session).get_all(owner_id=2, property_id="13,19")
        print(f"Found {len(props)} properties")
        for p in props:
            print(f"Prop ID: {p.id}, Name: {p.name}, Beds: {p.total_beds}, Occupied: {p.occupied_beds}")

if __name__ == "__main__":
    check_stats()
