import requests
import json

BASE_URL = "http://localhost:8000"

def test_stats():
    print("Testing Dashboard Stats via API...")
    try:
        response = requests.get(f"{BASE_URL}/stats")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Stats fetched successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed to fetch stats: {response.text}")
    except Exception as e:
        print(f"Error connecting to server: {str(e)}")

if __name__ == "__main__":
    test_stats()
