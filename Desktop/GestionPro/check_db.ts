import { supabase } from './src/lib/supabase';

const checkDb = async () => {
    console.log("Checking Supabase connection...");
    const { data, error } = await supabase.from('tenants').select('*').limit(1);

    if (error) {
        console.error("Error connecting to DB:", error);
    } else {
        console.log("Connection successful!");
        if (data && data.length > 0) {
            console.log("Sample Tenant:", data[0]);
            console.log("ID Type:", typeof data[0].id);
            console.log("ID Value:", data[0].id);
        } else {
            console.log("No tenants found.");
        }
    }
};

checkDb();
