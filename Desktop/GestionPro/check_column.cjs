
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

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
        console.log('Column exists.');
    }
}

checkColumn();
