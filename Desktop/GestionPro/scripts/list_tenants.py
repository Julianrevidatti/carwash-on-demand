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

def list_all():
    query_url = f"{SUPABASE_URL}/rest/v1/tenants?select=id,business_name,contact_name,status"
    response = requests.get(query_url, headers=headers)
    tenants = response.json()
    for t in tenants:
        print(f"[{t['status']}] {t['business_name']} | {t['contact_name']} (ID: {t['id']})")

if __name__ == "__main__":
    list_all()
