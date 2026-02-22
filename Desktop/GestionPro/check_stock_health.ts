
import { createClient } from '@supabase/supabase-js';

// Load env vars if needed, or hardcode for this script since we saw keys in check_tables_debug.ts
// We'll use the keys found in check_tables_debug.ts for simplicity/reliability in this context
// Replacing 'dotenv' with simpler approach since it's hardcoded
const supabaseUrl = 'https://qeltuiqarfhymbhkdyan.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStockHealth() {
    console.log("=== STARTING STOCK HEALTH CHECK ===");

    // 1. Check for Negative Stock in Batches (should not happen if logic is correct)
    console.log("\n1. Checking for Negative Stock in BATCHES...");
    const { data: negativeBatches, error: batchError } = await supabase
        .from('inventory_batches')
        .select('*') // Get all fields
        .lt('quantity', 0);

    if (batchError) {
        console.error("Error checking batches:", batchError);
    } else if (negativeBatches && negativeBatches.length > 0) {
        console.log(`⚠️ FOUND ${negativeBatches.length} BATCHES WITH NEGATIVE QUANTITY:`);
        negativeBatches.forEach(b => console.log(`   - ID: ${b.id}, Batch: ${b.batch_number}, ProdID: ${b.product_id}, Qty: ${b.quantity}`));
    } else {
        console.log("✅ No negative stock found in batches.");
    }

    // 2. Check for Negative Stock in Bulk Products
    console.log("\n2. Checking for Negative Stock in BULK PRODUCTS...");
    const { data: negativeBulk, error: bulkError } = await supabase
        .from('bulk_products')
        .select('*')
        .lt('stock_kg', 0);

    if (bulkError) {
        console.error("Error checking bulk products:", bulkError);
    } else if (negativeBulk && negativeBulk.length > 0) {
        console.log(`⚠️ FOUND ${negativeBulk.length} BULK PRODUCTS WITH NEGATIVE STOCK:`);
        negativeBulk.forEach(p => console.log(`   - Name: ${p.name} (ID: ${p.id}), Stock: ${p.stock_kg} kg`));
    } else {
        console.log("✅ No negative stock found in bulk products.");
    }

    // 3. Check for Anomalous Stock Movements
    console.log("\n3. Checking for Anomalous Stock Movements...");
    const { data: anomalousMovements, error: movError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('quantity', 0)
        .limit(10); // Check for zero movements

    if (movError) {
        console.error("Error checking movements:", movError);
    } else if (anomalousMovements && anomalousMovements.length > 0) {
        console.log(`⚠️ Found ${anomalousMovements.length} movements with 0 quantity (Sample):`);
        anomalousMovements.forEach(m => console.log(`   - ${m.product_name} on ${m.date}: Qty ${m.quantity}`));
    } else {
        console.log("✅ No 0-quantity movements found.");
    }

    // 4. Check total counts for context
    const { count: batchCount } = await supabase.from('inventory_batches').select('*', { count: 'exact', head: true });
    const { count: bulkCount } = await supabase.from('bulk_products').select('*', { count: 'exact', head: true });
    console.log(`\nTotal Batches checked: ${batchCount}`);
    console.log(`Total Bulk Products checked: ${bulkCount}`);

    console.log("\n=== STOCK HEALTH CHECK COMPLETE ===");
}

checkStockHealth();
