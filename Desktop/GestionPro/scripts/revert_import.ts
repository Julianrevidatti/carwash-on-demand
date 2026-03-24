import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: USAR SERVICE ROLE O BYPASS RLS
// As the user has setup_new_supabase.sql, we know the Postgres URL. We don't have the Service Role Key here, only Anon.
// BUT since we don't have service role, let's use the DB connection directly if needed.
// Wait, actually, let's try with Anon Key first but we will fetch using RPC or just delete everything matching the date because the admin might be logged out of this script.
// Let's print out the exact DB timezone issue first.

const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url!, key!);

async function run() {
    const tenantId = '2b420918-6441-4634-b494-eba28f88b44d'; // gemabebidas00@gmail.com

    console.log(`[+] Buscando los ultimos 150 productos de gemabebidas...`);

    // Obtenemos los mas recientes sin filtro de fecha, solo los ultimos 150
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(160);

    if (error) {
        console.error("[-] Error en lectura (Probablemente RLS):", error);
        return;
    }

    if (!products || products.length === 0) {
        console.log("[-] No se encontraron productos o RLS bloqueo la lectura anon.");
        return;
    }

    console.log(`[+] Se encontraron ${products.length} productos visualizados por ultimo (anon)`);
    console.log(`[+] Ultimo insertado: ${products[0].name} a las ${products[0].created_at}`);
}

run();
