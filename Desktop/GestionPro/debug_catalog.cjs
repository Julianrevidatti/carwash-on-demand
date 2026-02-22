
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

async function debugCatalog() {
    console.log('=== DEBUGGING CATALOG ===');

    // 1. Find Tenant
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id, business_name, whatsapp_number, is_open')
        .ilike('business_name', '%Mi Negocio%');

    if (tenantError) {
        console.error('Error finding tenant:', tenantError);
        return;
    }

    if (!tenants || tenants.length === 0) {
        console.error('No tenant found matching "Mi Negocio"');
        return;
    }

    console.log(`Found ${tenants.length} tenants matching "Mi Negocio":`);
    tenants.forEach(t => console.log(`- [${t.id}] ${t.business_name} (WA: ${t.whatsapp_number}, Open: ${t.is_open})`));

    const tenantId = tenants[0].id; // Use the first one
    console.log(`\nChecking products for Tenant ID: ${tenantId}`);

    // 2. Fetch Products (Raw)
    const { data: allProducts, error: prodError } = await supabase
        .from('products')
        .select('id, name, is_active, stock, tenant_id')
        .eq('tenant_id', tenantId);

    if (prodError) {
        console.error('Error fetching products:', prodError);
        return;
    }

    console.log(`\nTotal Products found in DB: ${allProducts.length}`);

    // 3. Analyze Filters
    const activeProducts = allProducts.filter(p => p.is_active);
    const stockProducts = allProducts.filter(p => p.stock > 0);
    const visibleProducts = allProducts.filter(p => p.is_active && p.stock > 0);

    console.log(`- Active: ${activeProducts.length}`);
    console.log(`- With Stock (>0): ${stockProducts.length}`);
    console.log(`- VISIBLE (Active + Stock): ${visibleProducts.length}`);

    if (visibleProducts.length === 0 && allProducts.length > 0) {
        console.log('\n⚠️  PROBLEM IDENTIFIED: Products exist but none meet visibility criteria (Active + Stock > 0).');
        console.log('Sample Products:');
        allProducts.slice(0, 3).forEach(p => {
            console.log(`- ${p.name}: Active=${p.is_active}, Stock=${p.stock}`);
        });
    } else if (allProducts.length === 0) {
        console.log('\n⚠️  PROBLEM IDENTIFIED: No products found for this tenant ID.');
    } else {
        console.log('\n✅ Products should be visible.');
    }
}

debugCatalog();
