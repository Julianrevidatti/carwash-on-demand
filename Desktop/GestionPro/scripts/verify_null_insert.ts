import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('get_table_info', { p_table_name: 'products' });
    if (error) {
        // Intento alternativo sacando info basic de metadata o inserción fallida
        const { data: d2, error: e2 } = await supabase.from('products').insert([
            { barcode: 'TEST_NULL_SUPPLIER', name: 'Test', cost: 1, price: 1, profit_margin: 0, is_pack: false, tenant_id: '00000000-0000-0000-0000-000000000000' }
        ]).select();
        console.log("Error al insertar nulo:", e2);
    } else {
        console.log(data);
    }
}

run();
