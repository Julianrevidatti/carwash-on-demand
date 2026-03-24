import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeltuiqarfhymbhkdyan.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU'; // This is the anon key, but we need the service role key to delete users!

// Since we cannot read the service role key programmatically from the .env because it is not there,
// we will have the user configure it or find it.
console.log('You need the SUPABASE_SERVICE_ROLE_KEY to delete users programmatically.');
