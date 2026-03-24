import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def deep_search_all():
    query_url = f"{SUPABASE_URL}/rest/v1/tenants?select=*"
    response = requests.get(query_url, headers=headers)
    tenants = response.json()
    matches = 0
    for t in tenants:
        t_str = json.dumps(t).lower()
        if 'irala' in t_str:
            matches += 1
            print(f"🎯 MATCH #{matches}: {t['business_name']} ({t['id']})")
            print(f"   Status: {t['status']}, Payment: {t['payment_status']}")
            print(f"   Due Date: {t['next_due_date']}")
            print(f"   Address: {t.get('address')}")
    if matches == 0:
        print("❌ No matches found.")

if __name__ == "__main__":
    deep_search_all()
