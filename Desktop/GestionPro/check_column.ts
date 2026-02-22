
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log('Checking if whatsapp_number column exists...');

    // Try to select the column specifically
    const { data, error } = await supabase
        .from('tenants')
        .select('whatsapp_number')
        .limit(1);

    if (error) {
        console.error('Error selecting whatsapp_number:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('COLUMN_MISSING');
        }
    } else {
        console.log('Column exists. Data sample:', data);
    }
}

checkColumn();
