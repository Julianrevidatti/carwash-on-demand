import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# Fetch some bulk sale items from March
res = supabase.table("sale_items").select("product_id, name, quantity, price").ilike("name", "%kg)%").limit(10).execute()

print("MUESTRA DE SALE_ITEMS (BULK):")
for item in res.data:
    print(f"ID: {item['product_id']} | Name: {item['name']} | Qty: {item['quantity']}")

# Fetch some bulk products from catalog
bulk = supabase.table("bulk_products").select("id, name").limit(10).execute()
print("\nMUESTRA DE BULK_PRODUCTS (CATALOG):")
for b in bulk.data:
    print(f"ID: {b['id']} | Name: {b['name']}")
