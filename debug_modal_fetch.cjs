const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role to bypass RLS initially for ground truth, then anon for RLS check

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

// Client behaving like the frontend (Anon key) - wait, frontend uses Auth. 
// I need valid auth to test RLS properly.
// But first, let's use Service Role to see if the DATA exists at all.
const adminClient = createClient(supabaseUrl, supabaseServiceRole || supabaseKey);

async function debug() {
    console.log('--- DEBUGGING DATA EXISTENCE ---');

    // 1. Check unit assignments
    const { data: assignments, error: assignError } = await adminClient
        .from('unit_assignments')
        .select(`
            *,
            units (
                id, label, meter_number,
                property_id,
                properties (name, landlord_id, location)
            )
        `)
        .eq('status', 'active'); // Just get all active

    if (assignError) {
        console.error('Error fetching assignments:', assignError);
    } else {
        console.log(`Found ${assignments.length} active assignments.`);
        if (assignments.length > 0) {
            console.log('Sample Assignment:', JSON.stringify(assignments[0], null, 2));
        } else {
            console.log('NO active assignments found in DB.');
        }
    }

    console.log('\n--- CHECKING UNITS TABLE RLS ---');
    // We can't easily test RLS from here without a valid user token.
    // But if the data exists above, it's likely RLS.
}

debug();
