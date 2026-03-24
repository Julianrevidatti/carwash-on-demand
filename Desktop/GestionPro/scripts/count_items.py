import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# Get tenant_id from first sale
sale = supabase.table("sales").select("tenant_id").limit(1).execute()
tenant_id = sale.data[0]['tenant_id']
print(f"TENANT_ID: {tenant_id}")

# Count products
prod_count = supabase.table("products").select("id", count="exact").eq("tenant_id", tenant_id).execute()
bulk_count = supabase.table("bulk_products").select("id", count="exact").eq("tenant_id", tenant_id).execute()

print(f"REGULAR PRODUCTS: {prod_count.count}")
print(f"BULK PRODUCTS: {bulk_count.count}")
print(f"TOTAL: {prod_count.count + bulk_count.count}")
