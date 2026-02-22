import { supabase } from './src/lib/supabase';

const testInsert = async () => {
    console.log("Testing insert with non-UUID ID...");
    const testId = "user_test_" + Date.now();

    const { data, error } = await supabase.from('tenants').insert([{
        id: testId,
        business_name: "Test Business",
        contact_name: "test@example.com",
        status: "ACTIVE"
    }]).select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert successful!", data);
        // Clean up
        await supabase.from('tenants').delete().eq('id', testId);
    }
};

testInsert();
