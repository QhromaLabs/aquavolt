import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { email, password, fullName, phoneNumber, unitId } = await req.json();

    // 1. Create User in Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'tenant' },
    });

    if (authError) throw authError;

    const userId = authUser.user.id;

    // 2. Create Profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email,
        phone: phoneNumber,
        role: 'tenant',
      });

    if (profileError) throw profileError;

    // 3. Assign Unit
    const { error: assignmentError } = await supabaseClient
      .from('unit_assignments')
      .insert({
        unit_id: unitId,
        tenant_id: userId,
        status: 'active',
        start_date: new Date().toISOString(),
      });

    if (assignmentError) throw assignmentError;

    // 4. Update Unit Status
    const { error: unitError } = await supabaseClient
      .from('units')
      .update({ status: 'active' })
      .eq('id', unitId);

    if (unitError) throw unitError;

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
