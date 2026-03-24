import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def list_locked():
    query_url = f"{SUPABASE_URL}/rest/v1/tenants?status=eq.LOCKED"
    response = requests.get(query_url, headers=headers)
    tenants = response.json()
    print(f"🔒 Found {len(tenants)} LOCKED tenants:")
    for t in tenants:
        print(f"- {t['business_name']} ({t['contact_name']}) | Expires: {t['next_due_date']}")

if __name__ == "__main__":
    list_locked()
