import { supabase } from './src/lib/supabase';

async function checkAuth() {
    console.log("Checking Auth connection...");
    // Try to sign in with a definitely non-existent user to check if the service responds
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test_connection_user@example.com',
        password: 'wrong_password_123'
    });

    if (error) {
        console.log("Auth Service Responded:");
        console.log("Error Status:", error.status);
        console.log("Error Message:", error.message);
        if (error.message.includes("Invalid login credentials")) {
            console.log("SUCCESS: Auth service is reachable and validating credentials.");
        } else {
            console.log("WARNING: Unexpected error message.");
        }
    } else {
        console.log("Unexpected success (should have failed):", data);
    }
}

checkAuth();
