import requests
resp = requests.get("http://127.0.0.1:8000/tenant/dashboard/22")
print("Response status:", resp.status_code)
print("Response JSON:")
import json
print(json.dumps(resp.json(), indent=2))
