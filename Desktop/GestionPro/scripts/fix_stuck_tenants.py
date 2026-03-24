import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    print("❌ Error: VITE_SUPABASE_URL not found in .env")
    exit(1)

print(f"🔍 Checking tenants at {SUPABASE_URL}...")

def fix_tenants():
    # Headers for Supabase
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # 1. Fetch tenants that are LOCKED but have a future due date
    query_url = f"{SUPABASE_URL}/rest/v1/tenants?status=eq.LOCKED&next_due_date=gt.now()"
    
    try:
        response = requests.get(query_url, headers=headers)
        if response.status_code != 200:
            print(f"❌ Error fetching tenants: {response.text}")
            if "policy" in response.text.lower():
                print("💡 Tip: You might need the SERVICE_ROLE_KEY to bypass RLS.")
            return

        tenants = response.json()
        
        if not tenants:
            print("✅ No tenants found stuck in LOCKED status with active time.")
            return

        print(f"⚠️ Found {len(tenants)} tenants to restore:")
        for t in tenants:
            print(f"  - {t['business_name']} (ID: {t['id']}, Expires: {t['next_due_date']})")

        # 2. Update them to ACTIVE
        confirm = input("\nDo you want to restore these tenants to ACTIVE? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return

        for t in tenants:
            update_url = f"{SUPABASE_URL}/rest/v1/tenants?id=eq.{t['id']}"
            update_data = {
                "status": "ACTIVE",
                "payment_status": "PAID"
            }
            res = requests.patch(update_url, headers=headers, json=update_data)
            if res.status_code in [200, 201, 204]:
                print(f"✅ Restored: {t['business_name']}")
            else:
                print(f"❌ Failed to restore {t['business_name']}: {res.text}")

    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    fix_tenants()
