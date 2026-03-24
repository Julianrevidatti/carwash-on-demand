import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# ==============================================================================
# SCRIPT DE REVERSIÓN DE IMPORTACIÓN MASIVA
# Basado en directivas/revertir_importacion_SOP.md
# ==============================================================================

def main():
    print("Iniciando Herramienta de Reversión de Importaciones...")
    
    # Cargar variables de entorno
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(dotenv_path=env_path)
    
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Error: Faltan credenciales de Supabase en .env.local")
        sys.exit(1)
        
    supabase: Client = create_client(url, key)
    
    print("\n--- PASO 1: Identificación del Cliente ---")
    email = input("Ingrese el email (usuario) del cliente al que se le revertirá la importación: ").strip()
    
    # Buscar Tenant ID
    res = supabase.table('tenants').select('id, business_name').eq('contact_name', email).execute()
    if not res.data:
        print(f"❌ Error: No se encontró ningún negocio asociado al email '{email}'.")
        sys.exit(1)
        
    tenant = res.data[0]
    tenant_id = tenant['id']
    print(f"✅ Negocio encontrado: {tenant['business_name']} (ID: {tenant_id})")
    
    print("\n--- PASO 2: Filtro de Tiempo ---")
    minutes_str = input("¿En los últimos cuántos minutos se realizó la importación errónea? (Ej: 10): ").strip()
    try:
        minutes = int(minutes_str)
    except ValueError:
        print("❌ Error: Debe ingresar un número válido de minutos.")
        sys.exit(1)
        
    # Calcular timestamp de búsqueda
    time_threshold = datetime.utcnow() - timedelta(minutes=minutes)
    time_threshold_iso = time_threshold.isoformat() + "Z"
    
    print(f"\nBuscando productos creados a partir de: {time_threshold_iso} UTC...")
    
    # Buscar productos recientes
    prods_res = supabase.table('products') \
        .select('id, name, created_at') \
        .eq('tenant_id', tenant_id) \
        .gte('created_at', time_threshold_iso) \
        .execute()
        
    products = prods_res.data
    
    if not products:
        print("ℹ️ No se encontraron productos importados en ese lapso de tiempo.")
        sys.exit(0)
        
    print(f"\n⚠️ SE ENCONTRARON {len(products)} PRODUCTOS RECIENTES:")
    for i, p in enumerate(products[:10]):
        print(f"  - {p['name']} (ID: {p['id'][:8]}...)")
    if len(products) > 10:
        print(f"  ... y {len(products) - 10} productos más.")
        
    print("\n--- PASO 3: Ejecución de Borrado ---")
    confirm = input(f"¿Desea ELIMINAR PERMANENTEMENTE estos {len(products)} productos de {tenant['business_name']}? (escriba 'SI' para confirmar): ").strip()
    
    if confirm != "SI":
        print("🛑 Operación cancelada por el usuario. No se borró nada.")
        sys.exit(0)
        
    print("\nIniciando borrado (ON DELETE CASCADE limpiará lotes y movimientos)...")
    
    deleted_count = 0
    errors = 0
    
    for p in products:
        try:
            # Borrar 1 a 1 para mejor control, aunque se podría hacer in()
            supabase.table('products').delete().eq('id', p['id']).execute()
            deleted_count += 1
            print(f"✅ Borrado: {p['name']}")
        except Exception as e:
            print(f"❌ Error borrando {p['name']}. Puede que esté asociado a una venta. Detalles: {e}")
            errors += 1
            
    print("\n==================================")
    print("REVERSIÓN COMPLETADA")
    print(f"Productos eliminados exitosamente: {deleted_count}")
    print(f"Errores: {errors}")
    print("==================================")

if __name__ == "__main__":
    main()
