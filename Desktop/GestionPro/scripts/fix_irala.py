import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def find_irala():
    print(f"🔍 Searching for 'irala' in {SUPABASE_URL}...")
    
    # Try searching in business_name or contact_name
    query_url = f"{SUPABASE_URL}/rest/v1/tenants?or=(business_name.ilike.*irala*,contact_name.ilike.*irala*)"
    
    try:
        response = requests.get(query_url, headers=headers)
        tenants = response.json()
        
        if not tenants:
            print("❌ No matching tenants found for 'irala'.")
            return

        for t in tenants:
            print(f"\n📌 Tenant Found: {t['business_name']}")
            print(f"   ID: {t['id']}")
            print(f"   Status: {t['status']}")
            print(f"   Payment Status: {t['payment_status']}")
            print(f"   Due Date: {t['next_due_date']}")
            
            if t['status'] == 'LOCKED':
                print(f"   ⚠️ This tenant is LOCKED.")
                update_url = f"{SUPABASE_URL}/rest/v1/tenants?id=eq.{t['id']}"
                update_data = {"status": "ACTIVE", "payment_status": "PAID"}
                res = requests.patch(update_url, headers=headers, json=update_data)
                if res.status_code in [200, 204]:
                    print("   ✅ Access RESTORED to 'ACTIVE'.")
                else:
                    print(f"   ❌ Failed to restore: {res.text}")
            else:
                print("   ✅ This tenant is already ACTIVE.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    find_irala()
