import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get valid auth token
async function getAuthToken(supabaseClient: any) {
    const { data: creds } = await supabaseClient
        .from('api_credentials')
        .select('credentials')
        .eq('service_name', 'futurise')
        .single()

    const { token, token_expires_at } = creds.credentials

    // Check if token is expired or doesn't exist
    if (!token || !token_expires_at || new Date(token_expires_at) < new Date()) {
        // Token expired, refresh it
        const authResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/futurise-auth`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
        })

        const authData = await authResponse.json()
        return authData.token
    }

    return token
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action = 'vend', ...params } = await req.json()

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get credentials
        const { data: creds } = await supabaseClient
            .from('api_credentials')
            .select('credentials')
            .eq('service_name', 'futurise')
            .single()

        if (!creds) throw new Error('Futurise credentials not found')
        const { base_url, endpoints } = creds.credentials

        // Get valid auth token
        const authToken = await getAuthToken(supabaseClient)

        let responseData;
        let endpointUrl;
        let method = 'POST';
        let bodyPayload = {};

        switch (action) {
            case 'vend':
                endpointUrl = `${base_url}${endpoints.charge}`;
                bodyPayload = {
                    meterNo: params.meterNumber,
                    money: params.amount
                };
                break;

            case 'check_meter':
                endpointUrl = `${base_url}${endpoints.manage || '/api/v1/meter-recharge/meter-token/0'}`;
                bodyPayload = {
                    meterNo: params.meterNumber,
                    method: 1,
                    subClass: 1, // Clear Credit check
                    value: 0
                };
                break;

            case 'maintenance_token':
                endpointUrl = `${base_url}${endpoints.manage || '/api/v1/meter-recharge/meter-token/0'}`;
                // method=1 is fixed for token generation usually
                bodyPayload = {
                    meterNo: params.meterNumber,
                    method: 1,
                    subClass: parseInt(params.subClass),
                    value: parseFloat(params.value) || 0
                };
                break;

            case 'get_regions':
                // Note: base_url might include /api, and endpoints might be relative
                // We assume getRegions endpoint is like /v1/archives/area
                // If base_url is http://.../api, then just appending /v1/... works if base doesn't have it?
                // Actually existing code in futuriseDev.js used `${PROXY_BASE_URL}/v1/archives/area`
                // Let's assume we construct it safely.
                // We'll use a hardcoded path if not in endpoints config, assuming standard API.
                endpointUrl = `${base_url}/v1/archives/area`.replace('//v1', '/v1');
                method = 'GET';
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        console.log(`Executing ${action} against ${endpointUrl}`);

        // Create HTTP client that accepts self-signed certificates (for Futurise API)
        const client = Deno.createHttpClient({
            // @ts-ignore - Deno types might not include this
            caCerts: [],
        });

        const fetchOptions: any = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            client: client, // Use custom client that accepts self-signed certs
        };

        if (method === 'POST') {
            fetchOptions.body = JSON.stringify(bodyPayload);
        }

        const apiRes = await fetch(endpointUrl, fetchOptions);

        if (!apiRes.ok) {
            const txt = await apiRes.text();
            // Pass through 404/500 for meter check handling
            if (action === 'check_meter' && (apiRes.status === 404 || apiRes.status === 500 || txt.includes('record not found'))) {
                return new Response(
                    JSON.stringify({ success: false, exists: false, message: 'Meter not found' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
            throw new Error(`Futurise API error: ${apiRes.status} ${txt}`);
        }

        const apiData = await apiRes.json();

        // Log sync (maybe only for writes?)
        if (['vend', 'maintenance_token'].includes(action)) {
            await supabaseClient.from('futurise_sync_log').insert({
                sync_type: action,
                status: apiData.code === 200 ? 'success' : 'failed',
                items_synced: apiData.code === 200 ? 1 : 0,
                error_message: apiData.msg,
                request_data: params,
                response_data: apiData,
            })
        }

        // Response Handling
        if (action === 'vend') {
            if (apiData.code !== 200) throw new Error(apiData.msg || 'Vending failed');
            const d = apiData.data;
            responseData = {
                success: true,
                token: d.form,
                transactionId: d.flowNo,
                requestId: apiData.requestId,
                meterNumber: d.meterNo,
                amount: params.amount,
                units: d.value,
                clearTime: d.clearTime,
            };
        } else if (action === 'check_meter') {
            if (apiData.code === 200) {
                responseData = { success: true, exists: true, message: 'Meter Validated', details: apiData.data };
            } else {
                responseData = { success: false, exists: false, message: apiData.msg };
            }
        } else if (action === 'get_regions') {
            if (apiData.code === 200) {
                responseData = { success: true, data: apiData.data || [] };
            } else {
                responseData = { success: false, message: apiData.msg };
            }
        } else if (action === 'maintenance_token') {
            if (apiData.code === 200 && apiData.data) {
                const d = apiData.data;
                responseData = {
                    success: true,
                    token: d.form,
                    meterNumber: d.meterNo,
                    subClass: params.subClass,
                    value: d.value,
                    explain: d.explain,
                    transactionId: d.flowNo,
                    clearTime: d.clearTime,
                    rawData: d
                };
            } else {
                throw new Error(apiData.msg || 'Maintenance token generation failed');
            }
        }

        return new Response(
            JSON.stringify(responseData),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        console.error('Error stack:', error.stack)
        return new Response(
            JSON.stringify({
                success: false,
                message: error.message || 'Token vending failed',
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 so client can parse error details
            }
        )
    }
})
