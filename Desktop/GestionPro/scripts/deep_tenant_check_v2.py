import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# Get some bulk sale items from March
res = supabase.table("sale_items").select("product_id, name, sales(tenant_id)").ilike("name", "%kg)%").limit(10).execute()

print(f"Items found: {len(res.data)}")

for i in res.data:
    pid = i['product_id']
    name = i['name']
    # Access the nested sales object (Supabase returns a list if plural, or object based on relation)
    # The select "sales(tenant_id)" creates a 'sales' key
    sales_info = i.get('sales')
    tid = sales_info.get('tenant_id') if sales_info else "UNKNOWN"
    
    # Check if product exists in regular products for THIS tenant
    p_match = supabase.table("products").select("id").eq("id", pid).eq("tenant_id", tid).execute() if tid != "UNKNOWN" else None
    
    # Check if product exists in bulk products for THIS tenant
    b_match = supabase.table("bulk_products").select("id").eq("id", pid).eq("tenant_id", tid).execute() if tid != "UNKNOWN" else None
    
    print(f"Item: {name} | Sale Tenant: {tid}")
    print(f" - ID: {pid}")
    print(f" - Found in Regular Table: {len(p_match.data) > 0 if p_match else 'N/A'}")
    print(f" - Found in Bulk Table: {len(b_match.data) > 0 if b_match else 'N/A'}")
    print("-" * 20)
