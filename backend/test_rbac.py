import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_login():
    print("--- Testing Login ---")
    # Test Owner Login
    payload = {"email": "admin@pgpro.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/login", json=payload)
    print(f"Owner Login: {r.status_code}")
    print(r.json())

    # Test Staff Login (seeded in main.py)
    # Staff(name="Arjun Singh", role="Property Manager", email="arjun@pgmanager.com", password="password123", ...)
    payload = {"email": "arjun@pgmanager.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/login", json=payload)
    print(f"Staff Login: {r.status_code}")
    print(r.json())

def test_filtering():
    print("\n--- Testing Filtering ---")
    # Get all tenants (as owner)
    r = requests.get(f"{BASE_URL}/tenants?owner_id=1")
    print(f"All Tenants (Owner 1): {len(r.json())}")

    # Get tenants for specific property (as manager)
    # Sunshine PG is ID 1
    r = requests.get(f"{BASE_URL}/tenants?owner_id=1&property_id=1")
    print(f"Tenants (Property 1): {len(r.json())}")
    
    # Get stats for specific property
    r = requests.get(f"{BASE_URL}/stats?owner_id=1&property_id=1")
    print(f"Stats (Property 1): {r.json()}")

if __name__ == "__main__":
    try:
        test_login()
        test_filtering()
    except Exception as e:
        print(f"Error: {e}")
