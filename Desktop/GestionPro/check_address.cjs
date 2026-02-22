
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAddressColumn() {
    console.log('Checking if address column exists...');

    const { data, error } = await supabase
        .from('tenants')
        .select('address')
        .limit(1);

    if (error) {
        console.error('Error selecting address:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('COLUMN_MISSING');
        }
    } else {
        console.log('Column exists.');
    }
}

checkAddressColumn();
