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
        const { phoneNumber, amount, passkey, unitId, tenantId } = await req.json()

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

        const config = creds.credentials
        const CONSUMER_KEY = config.consumer_key
        const CONSUMER_SECRET = config.consumer_secret
        const SHORTCODE = config.shortcode
        const PASSKEY = passkey || config.passkey

        if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY) {
            throw new Error('Missing M-Pesa configuration (Key, Secret, Shortcode, or Passkey)')
        }

        // Debug: Log credentials (first/last 4 chars only for security)
        console.log('M-Pesa Config:', {
            key: `${CONSUMER_KEY.substring(0, 4)}...${CONSUMER_KEY.substring(CONSUMER_KEY.length - 4)}`,
            secret: `${CONSUMER_SECRET.substring(0, 4)}...${CONSUMER_SECRET.substring(CONSUMER_SECRET.length - 4)}`,
            shortcode: SHORTCODE,
            passkey: `${PASSKEY.substring(0, 8)}...`
        })

        // 4. Get Access Token from Safaricom (PRODUCTION)
        const auth = btoa(`${CONSUMER_KEY.trim()}:${CONSUMER_SECRET.trim()}`)
        console.log('Auth header (first 20 chars):', auth.substring(0, 20))

        const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}` }
        })

        console.log('Safaricom OAuth Response Status:', tokenRes.status)

        if (!tokenRes.ok) {
            const txt = await tokenRes.text()
            console.error('Safaricom OAuth Error:', txt)
            throw new Error(`Failed to get access token: ${tokenRes.status} ${txt}`)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token

        // 5. Generate Password & Timestamp
        // Force Nairobi Time (UTC+3) logic manually to be safe in Deno environment
        const now = new Date()
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

        // 7. Send STK Push (PRODUCTION)
        const stkUrl = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
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
                "CallBackURL": `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
                "AccountReference": "AquaVolt",
                "TransactionDesc": "Token Purchase"
            })
        })

        const stkData = await stkRes.json()
        console.log('Safaricom Response:', JSON.stringify(stkData))

        // 8. Create payment tracking record
        if (stkData.ResponseCode === '0') {
            const { data: paymentRecord, error: paymentError } = await supabaseClient
                .from('mpesa_payments')
                .insert({
                    checkout_request_id: stkData.CheckoutRequestID,
                    merchant_request_id: stkData.MerchantRequestID,
                    phone_number: formattedPhone,
                    amount: amount,
                    unit_id: unitId || null,
                    tenant_id: tenantId || null,
                    status: 'pending'
                })
                .select()
                .single()

            if (paymentError) {
                console.error('Failed to create payment record:', paymentError)
                // Don't fail the request, STK push was successful
            } else {
                console.log('Payment tracking record created:', paymentRecord.id)
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    data: stkData,
                    checkoutRequestId: stkData.CheckoutRequestID // Return for frontend polling
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        } else {
            // Return 200 even on error so client can see the message body (Supabase functions throw on 400)
            return new Response(
                JSON.stringify({ success: false, message: stkData.errorMessage || 'STK Push Failed', data: stkData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

    } catch (error) {
        console.error('M-Pesa Edge Function Error:', error)
        return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 here too
        )
    }
})
