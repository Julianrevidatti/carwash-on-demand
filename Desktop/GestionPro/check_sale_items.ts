
import { supabase } from './src/lib/supabase';

async function checkSaleItemsSchema() {
    console.log("Checking sale_items table...");

    // Check if we can select from it
    const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error querying sale_items:", error);
    } else {
        console.log("Success querying sale_items. Rows:", data);
        if (data && data.length > 0) {
            console.log("First row keys:", Object.keys(data[0]));
        } else {
            console.log("Table is empty, cannot deduce keys from data.");
        }
    }
}

checkSaleItemsSchema();
