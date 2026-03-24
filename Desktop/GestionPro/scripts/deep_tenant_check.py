import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# Get some bulk sale items from March and their sale's tenant_id
res = supabase.table("sales").select("id, tenant_id, sale_items(product_id, name)").ilike("sale_items.name", "%kg)%").limit(5).execute()

for sale in res.data:
    tid = sale['tenant_id']
    items = sale['sale_items']
    for i in items:
        pid = i['product_id']
        name = i['name']
        
        # Check if product exists in regular products for THIS tenant
        p_match = supabase.table("products").select("id").eq("id", pid).eq("tenant_id", tid).execute()
        
        # Check if product exists in bulk products for THIS tenant
        b_match = supabase.table("bulk_products").select("id").eq("id", pid).eq("tenant_id", tid).execute()
        
        print(f"Item: {name} | Sale Tenant: {tid}")
        print(f" - ID: {pid}")
        print(f" - Found in Regular Table: {len(p_match.data) > 0}")
        print(f" - Found in Bulk Table: {len(b_match.data) > 0}")
        print("-" * 20)
