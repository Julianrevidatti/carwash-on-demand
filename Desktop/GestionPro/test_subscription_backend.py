import requests
import json
import uuid

# Configuration from .env
SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

EDGE_FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/create-subscription"

# Test Data
tenant_id = str(uuid.uuid4())
payload = {
    "reason": "Suscripción PRO - Test Diagnostico",
    "external_reference": f"{tenant_id}|PRO",
    "payer_email": "test_diagnostico@gestionpro.com",
    "amount": 13999,
    "tenant_id": tenant_id
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
}

print(f"Testing Edge Function: {EDGE_FUNCTION_URL}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(EDGE_FUNCTION_URL, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
    
    if response.status_code == 200:
        data = response.json()
        if "init_point" in data:
            print("\n✅ SUCCESS: init_point received!")
            print(f"URL: {data['init_point']}")
        else:
            print("\n⚠️ WARNING: Status 200 but no init_point found.")
    else:
        print("\n❌ FAILED: Backend returned error.")

except Exception as e:
    print(f"\n❌ ERROR: Script execution failed: {e}")
