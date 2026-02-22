
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeltuiqarfhymbhkdyan.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const checkClients = async () => {
    console.log("--- Diagnosing Clients ---");

    // 1. Check if we can reach the table
    const { count, error: countError } = await supabase.from('clients').select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error accessing 'clients' table:", countError.message);
        console.log("Possible Cause: Table does not exist or RLS policy blocks access.");
        return;
    }

    console.log(`Total accessible clients (RLS filtered): ${count}`);

    // 2. Fetch actual rows
    const { data: clients, error } = await supabase.from('clients').select('id, name, current_account_balance, tenant_id');

    if (error) {
        console.error("Error fetching clients:", error.message);
    } else {
        console.log("Clients found:");
        console.table(clients);
    }

    // 3. Check Tenant Context (Simulated)
    // We can't easily simulate "auth.uid()" without signing in. 
    // This script runs as 'anon' but WITHOUT a user session, so strict RLS policies checking "auth.uid()" 
    // will likely return 0 rows if the policy requires authentication.
    //
    // WAIT. If I use anon key without signIn, auth.uid() is null.
    // The policy: `tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text)`
    // If auth.uid() is null, this returns nothing.
    //
    // So this script might return 0 rows even if data exists, confirming RLS is ACTIVE (which is good), 
    // but failing to tell me if data is there for a specific user.
    //
    // To properly diagnose, I need to sign in as the user.
    // Provide a mocked email/password? No, I don't have user credentials.
    //
    // Alternative: Check if there's any public access or if I can assume failure based on previous context?
    // User said "cargue los clientes". If RLS was blocking INSERT, they wouldn't persist.
    // If RLS blocks INSERT, usually Supabase throws error 42501 (perm denied).
    // The app catches errors in `addClient` (console.error).
    //
    // Let's TRY to insert a test client and see if it fails.
    // But I can't start a session easily.

    // Idea: Use the `run_diagnosis_v3.ts` approach? No, that was for sessions.
    //
    // Critical Thought: The user ALREADY ran `setup_current_accounts.sql`?
    // If they didn't run it (despite saying "ok"), the TABLE might not exist.
    // The `check_db_setup.ts` in step 249 said "Table 'clients' exists."
    // So table is there.
    //
    // If they populated it, but RLS hides it from them?
    // The policy checks `auth.uid()`.
    // Maybe the `tenant_id` being inserted is wrong?
    // `addClient` uses `state.currentTenant?.id`.
    //
    // Let's ask the user to check console logs? Or look at RLS again.
    // The policy:
    // `USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text))`
    // This looks correct assuming `tenant.user_id` matches `auth.uid()`.
    // 
    // Common Pitfall: `client.tenant_id` is missing or null?
    // In `salesSlice.ts`:
    // `tenant_id: tenantId` is passed.
    //
    // What if the user didn't run the script to CREATE policies?
    // If no policy exists on an RLS-enabled table, Default is DENY ALL.
    // `ALTER TABLE clients ENABLE ROW LEVEL SECURITY;` was in the script.
    // If they ran the script, RLS is ON.
    // If they didn't run the `CREATE POLICY`, then NO ONE can see anything.
    // This is the most likely cause.

    console.log("\n--- Checking for RLS Policy Helper --");
    // I cannot query pg_policies via API easily.
};

checkClients();
