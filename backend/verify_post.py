import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_property():
    print("Testing Property Creation via API...")
    payload = {
        "name": "Test PG Location",
        "address": "123 Test Street, Bangalore",
        "total_rooms": 10,
        "total_beds": 30,
        "occupied_beds": 0,
        "monthly_revenue": 0.0,
        "manager": "Test Manager",
        "phone": "+91 99999 99999"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/properties", json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Property created successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed to create property: {response.text}")
    except Exception as e:
        print(f"Error connecting to server: {str(e)}")

if __name__ == "__main__":
    test_create_property()
