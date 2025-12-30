import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
        const { topup_id } = await req.json()
        console.log("Resend SMS request for topup:", topup_id)

        if (!topup_id) {
            return new Response(JSON.stringify({ success: false, message: 'topup_id is required' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get topup details with unit and tenant info
        const { data: topup, error: topupError } = await supabaseClient
            .from('topups')
            .select(`
                *,
                units:unit_id (meter_number),
                mpesa_payments:mpesa_receipt_number (phone_number)
            `)
            .eq('id', topup_id)
            .single()

        if (topupError || !topup) {
            console.error('Topup not found:', topupError)
            return new Response(JSON.stringify({ success: false, message: 'Topup not found' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            })
        }

        // Get SMS credentials
        const { data: smsCreds } = await supabaseClient
            .from('api_credentials')
            .select('credentials')
            .eq('service_name', 'africastalking')
            .single()

        if (!smsCreds || !smsCreds.credentials) {
            return new Response(JSON.stringify({ success: false, message: 'SMS not configured' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        const { username, api_key, sms_template, sender_id } = smsCreds.credentials

        if (!username || !api_key) {
            return new Response(JSON.stringify({ success: false, message: 'SMS credentials incomplete' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        // Get phone number from mpesa_payments
        const phoneNumber = topup.mpesa_payments?.[0]?.phone_number

        if (!phoneNumber) {
            return new Response(JSON.stringify({ success: false, message: 'Phone number not found for this topup' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        // Prepare message
        let message = sms_template || 'Token: {token}. Units: {units} KWh. Amount: KES {amount}. Meter: {meter}.'
        message = message.replace('{token}', topup.token || 'N/A')
            .replace('{units}', parseFloat(topup.units_kwh || 0).toFixed(2))
            .replace('{amount}', topup.amount_paid || '0')
            .replace('{meter}', topup.units?.meter_number || 'N/A')
            .replace('{name}', 'Customer')

        // Format phone number
        let smsPhone = phoneNumber
        if (!smsPhone.startsWith('+')) {
            smsPhone = '+' + smsPhone
        }

        // Send SMS
        const atUrl = username === 'sandbox'
            ? 'https://api.sandbox.africastalking.com/version1/messaging'
            : 'https://api.africastalking.com/version1/messaging'

        const formBody = new URLSearchParams()
        formBody.append('username', username)
        formBody.append('to', smsPhone)
        formBody.append('message', message)
        if (sender_id) formBody.append('from', sender_id)

        const smsRes = await fetch(atUrl, {
            method: 'POST',
            headers: {
                'apiKey': api_key,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: formBody
        })

        const smsData = await smsRes.json()
        console.log('SMS Send Result:', JSON.stringify(smsData))

        // Log SMS attempt
        const smsStatus = smsRes.ok && smsData.SMSMessageData ? 'success' : 'failed'
        const errorMsg = smsStatus === 'failed' ? (smsData.message || JSON.stringify(smsData)) : null

        await supabaseClient.from('sms_logs').insert({
            tenant_id: topup.tenant_id,
            phone_number: smsPhone,
            message: message,
            status: smsStatus,
            provider: 'africastalking',
            response_data: smsData,
            error_message: errorMsg,
            topup_id: topup.id
        })

        return new Response(JSON.stringify({
            success: smsStatus === 'success',
            message: smsStatus === 'success' ? 'SMS sent successfully' : 'SMS failed to send',
            details: smsData
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Resend SMS Error:", error)
        return new Response(JSON.stringify({
            success: false,
            message: error.message || 'Failed to send SMS'
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
