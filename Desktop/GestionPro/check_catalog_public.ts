
import { createClient } from '@supabase/supabase-js';
// import * as dotenv from 'dotenv'; // Removed dependency
import * as fs from 'fs';

// Manually load .env if dotenv doesn't work out of the box with ts-node in this setup
const envFile = fs.readFileSync('.env', 'utf8');
const envConfig: any = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
});

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicAccess() {
    console.log("--- Checking Public Catalog Access ---");

    // 1. Try to fetch ANY tenant anonymously
    console.log("1. Fetching a Tenant (Public Access Check)...");
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('business_name, contact_name, whatsapp_number, is_open, id')
        .limit(1);

    // ... (error handling)

    const tenant = tenants[0];
    console.log(`✅ Tenant found: ${tenant.business_name} (ID: ${tenant.id})`);

    // 2. Fetch Products with ALL columns used in Frontend
    console.log(`2. Fetching Products (Full Schema Check)...`);
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, price, image_url, category, stock')
        .eq('tenant_id', tenant.id)
        .limit(5);

    if (prodError) {
        console.error("❌ Error fetching products:", prodError.message);
        console.log("   -> RLS Policy 'Public access to products' might be missing.");
        return;
    }

    console.log(`✅ Fetch successful. Found ${products?.length} products.`);
    if (products && products.length > 0) {
        console.log("   Sample Product:", products[0]);
    } else {
        console.log("   ⚠️ Tenant has no products or they are filtered out.");
        // Check if any products exist at all using service key if we had it, but we use Anon here.
    }
}

checkPublicAccess();
