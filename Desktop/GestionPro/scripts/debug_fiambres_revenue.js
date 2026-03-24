const fs = require('fs');

const url = "https://qeltuiqarfhymbhkdyan.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU";

async function run() {
    // Get all bulk products
    let res = await fetch(`${url}/bulk_products?select=id,name,supplier_id`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const bulks = await res.json();
    
    // Get suppliers
    res = await fetch(`${url}/suppliers?select=id,name`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const suppliers = await res.json();
    
    // Find fiambres
    const fiambresSup = suppliers.find(s => s.name.toLowerCase().includes('fiambres'));
    if (!fiambresSup) {
        console.log("No fiambres supplier found");
        return;
    }
    console.log("Fiambres Supplier ID:", fiambresSup.id);
    
    const fiambresBulks = bulks.filter(b => b.supplier_id === fiambresSup.id);
    console.log(`Found ${fiambresBulks.length} bulk products for fiambres:`, fiambresBulks.map(b => b.name));
    
    const fiambresIds = fiambresBulks.map(b => b.id);
    
    // Fetch sales and sale items from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    res = await fetch(`${url}/sales?select=id,date,total,sale_items(product_id,quantity,price,name)&date=gte.${thirtyDaysAgo.toISOString()}`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const sales = await res.json();
    
    console.log(`Total Sales in last 30 days:`, sales.length);
    
    let fiambresTotalRevenue = 0;
    
    for (const sale of sales) {
        if (!sale.sale_items) continue;
        for (const item of sale.sale_items) {
            if (fiambresIds.includes(item.product_id)) {
                const amount = item.price * item.quantity;
                fiambresTotalRevenue += amount;
                console.log(`- Date: ${sale.date}, Item: ${item.name}, Qty: ${item.quantity}, Price: ${item.price}, Amount: ${amount}`);
            }
        }
    }
    
    console.log("=========================================");
    console.log(`TOTAL REVENUE FOR FIAMBRES (Graneles) in last 30 days: $${fiambresTotalRevenue}`);
    console.log("=========================================");
}
run();
