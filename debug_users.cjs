
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jfkvsducukwgqsljoisw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impma3ZzZHVjdWt3Z3FzbGpvaXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTU3ODgwNzAsImV4cCI6MjA4MDc1ODk1OH0.twdtSeDDGoMCsaqAgDh5kwlzIkKlL78fUNIdErYE9wr8V4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Attempting to fetch profiles as ANON...');

    const { data, error } = await supabase.from('profiles').select('*').limit(5);

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Success! Profiles found:', data.length);
        console.log(data);
    }

    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin');
        if (rpcError) {
            console.error('RPC is_admin error:', rpcError);
        } else {
            console.log('is_admin result (anon):', rpcData);
        }
    } catch (e) {
        console.error('RPC failed', e);
    }
}

testFetch();
