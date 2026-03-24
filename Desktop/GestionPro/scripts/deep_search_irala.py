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

def deep_search():
    query_url = f"{SUPABASE_URL}/rest/v1/tenants?select=*" # Get all fields
    response = requests.get(query_url, headers=headers)
    tenants = response.json()
    for t in tenants:
        t_str = json.dumps(t).lower()
        if 'irala' in t_str:
            print(f"🎯 MATCH FOUND: {t['business_name']} ({t['id']})")
            print(f"   Fields: {t}")
            return t['id']
    print("❌ No matches found in any field.")
    return None

import json
if __name__ == "__main__":
    deep_search()
