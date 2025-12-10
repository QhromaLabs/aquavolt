import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Parse Request
        const { phoneNumber, amount, passkey } = await req.json()

        if (!phoneNumber || !amount) {
            throw new Error('Phone number and amount are required')
        }

        // 2. Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Fetch M-Pesa Credentials
        const { data: creds, error: credsError } = await supabaseClient
            .from('api_credentials')
            .select('credentials')
            .eq('service_name', 'mpesa')
            .single()

        if (credsError || !creds) {
            throw new Error('Failed to fetch M-Pesa credentials from database')
        }

        // Allow passing passkey from client safely (if temporarily testing) or fallback to DB
        const config = creds.credentials
        const CONSUMER_KEY = config.consumer_key
        const CONSUMER_SECRET = config.consumer_secret
        const SHORTCODE = config.shortcode
        const PASSKEY = passkey || config.passkey
        // Note: Production logic should strictly use DB passkey, but for "it works when I provide key" flow, we allow override.

        if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY) {
            throw new Error('Missing M-Pesa configuration (Key, Secret, Shortcode, or Passkey)')
        }

        // 4. Get Access Token from Safaricom
        const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)
        const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}` }
        })

        if (!tokenRes.ok) {
            const txt = await tokenRes.text()
            throw new Error(`Failed to get access token: ${tokenRes.status} ${txt}`)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token

        // 5. Generate Password & Timestamp
        // Force Nairobi Time (UTC+3) logic manually to be safe in Deno environment
        const now = new Date()
        // Add 3 hours in milliseconds for Nairobi offset from UTC, assuming Deno runs in UTC.
        // Better: use ISO string and parse? No, simplest is offset.
        // Actually, let's just construct it carefully.
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC time in ms
        const nairobiOffset = 3 * 60 * 60 * 1000;
        const nairobiDate = new Date(utc + nairobiOffset);

        const timestamp = nairobiDate.getFullYear() +
            ("0" + (nairobiDate.getMonth() + 1)).slice(-2) +
            ("0" + nairobiDate.getDate()).slice(-2) +
            ("0" + nairobiDate.getHours()).slice(-2) +
            ("0" + nairobiDate.getMinutes()).slice(-2) +
            ("0" + nairobiDate.getSeconds()).slice(-2)

        const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`)

        // 6. Format Phone Number (254...)
        let formattedPhone = phoneNumber.toString()
        if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.slice(1)
        if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)

        // 7. Send STK Push
        const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        const stkRes = await fetch(stkUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                "BusinessShortCode": SHORTCODE,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": amount,
                "PartyA": formattedPhone,
                "PartyB": SHORTCODE,
                "PhoneNumber": formattedPhone,
                "CallBackURL": "https://jfkvsducukwgqsljoisw.supabase.co/functions/v1/mpesa-callback",
                "AccountReference": "AquaVolt",
                "TransactionDesc": "Token Purchase"
            })
        })

        const stkData = await stkRes.json()
        console.log('Safaricom Response:', JSON.stringify(stkData))

        // Log transaction attempt
        await supabaseClient.from('futurise_sync_log').insert({
            sync_type: 'mpesa_stk_push',
            status: stkData.ResponseCode === '0' ? 'success' : 'failed',
            items_synced: 1,
            request_data: { phone: formattedPhone, amount },
            response_data: stkData,
            error_message: stkData.ResponseDescription
        })

        if (stkData.ResponseCode === '0') {
            return new Response(
                JSON.stringify({ success: true, data: stkData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        } else {
            return new Response(
                JSON.stringify({ success: false, message: stkData.errorMessage || 'STK Push Failed', data: stkData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

    } catch (error) {
        console.error('M-Pesa Edge Function Error:', error)
        return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
