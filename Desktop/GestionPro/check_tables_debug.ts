
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeltuiqarfhymbhkdyan.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables...');

    const tables = ['tenants', 'system_users', 'tenant_settings', 'payment_methods', 'promotions'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error accessing table ${table}:`, error.message);
        } else {
            console.log(`Table ${table} is accessible. Rows: ${data ? data.length : 0}`);
        }
    }
}

checkTables();
