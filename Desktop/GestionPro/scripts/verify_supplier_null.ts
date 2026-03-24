import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupplierId() {
    const { data, error } = await supabase
        .from('products')
        .select('supplier_id')
        .limit(5);

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log('Sample products:', data);
    }
}

checkSupplierId();
