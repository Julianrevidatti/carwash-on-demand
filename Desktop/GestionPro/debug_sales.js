import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qeltuiqarfhymbhkdyan.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSales() {
    console.log("Checking sales for current month...");

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    console.log(`Filtering sales >= ${firstDay}`);

    // Fetch ALL sales for this month without limit (or high limit)
    const { data, error } = await supabase
        .from('sales')
        .select('date, total, tenant_id')
        .gte('date', firstDay)
        .order('date', { ascending: true })
        .limit(10000);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} sales.`);

    // Group by day
    const salesByDay = {};
    data.forEach(s => {
        const d = new Date(s.date);
        const day = d.getDate();
        if (!salesByDay[day]) salesByDay[day] = 0;
        salesByDay[day]++;
    });

    console.log("Sales count by day:");
    for (const [day, count] of Object.entries(salesByDay)) {
        console.log(`Day ${day}: ${count} sales`);
    }
}

checkSales();
