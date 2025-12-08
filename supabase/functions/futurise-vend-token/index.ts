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
        const { meterNumber, amount, phoneNumber } = await req.json()

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

        const { base_url, endpoints } = creds.credentials

        // Get valid auth token
        const authToken = await getAuthToken(supabaseClient)

        // Call Futurise charge API
        const chargeResponse = await fetch(`${base_url}${endpoints.charge}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                meterNo: meterNumber,
                money: amount,
            }),
        })

        const chargeData = await chargeResponse.json()

        // Log the transaction
        await supabaseClient.from('futurise_sync_log').insert({
            sync_type: 'token_vend',
            status: chargeData.code === 200 ? 'success' : 'failed',
            items_synced: chargeData.code === 200 ? 1 : 0,
            error_message: chargeData.msg,
            request_data: { meterNumber, amount },
            response_data: chargeData,
        })

        if (chargeData.code !== 200) {
            throw new Error(chargeData.msg || 'Token vending failed')
        }

        // Extract token from response
        const tokenData = chargeData.data

        return new Response(
            JSON.stringify({
                success: true,
                token: tokenData.form, // The actual token
                transactionId: tokenData.flowNo,
                requestId: chargeData.requestId,
                meterNumber: tokenData.meterNo,
                amount: amount,
                units: tokenData.value,
                clearTime: tokenData.clearTime,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Token vend error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
