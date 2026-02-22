import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeltuiqarfhymbhkdyan.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listExpenses() {
    // Get all expenses
    const { data: expenses, error } = await supabase
        .from('operational_expenses')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        return;
    }

    console.log(`Found ${expenses.length} expenses.`);
    expenses.forEach(e => {
        console.log(`ID: ${e.id.substring(0, 8)}... | Description: ${e.description} | RAW Date: ${e.date}`);
    });
}

listExpenses();
