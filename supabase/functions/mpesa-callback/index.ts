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
        const body = await req.json()
        console.log("M-Pesa Callback Received:", JSON.stringify(body))

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Parse M-Pesa callback
        const stkCallback = body.Body?.stkCallback
        if (!stkCallback) {
            console.log('Invalid callback format')
            return new Response(JSON.stringify({ result: "ok" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }

        const checkoutRequestId = stkCallback.CheckoutRequestID
        const merchantRequestId = stkCallback.MerchantRequestID
        const resultCode = stkCallback.ResultCode
        const resultDesc = stkCallback.ResultDesc

        // Determine status based on result code
        let status = 'failed'
        let mpesaReceiptNumber = null
        let transactionDate = null

        if (resultCode === 0) {
            status = 'success'
            // Extract metadata
            const metadata = stkCallback.CallbackMetadata?.Item || []
            for (const item of metadata) {
                if (item.Name === 'MpesaReceiptNumber') {
                    mpesaReceiptNumber = item.Value
                }
                if (item.Name === 'TransactionDate') {
                    // Format: 20191219102115 -> 2019-12-19 10:21:15
                    const dateStr = item.Value.toString()
                    const year = dateStr.substring(0, 4)
                    const month = dateStr.substring(4, 6)
                    const day = dateStr.substring(6, 8)
                    const hour = dateStr.substring(8, 10)
                    const minute = dateStr.substring(10, 12)
                    const second = dateStr.substring(12, 14)
                    transactionDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`
                }
            }
        } else if (resultCode === 1032) {
            status = 'cancelled'
        } else if (resultCode === 1037) {
            status = 'timeout'
        }

        console.log(`Payment ${checkoutRequestId}: ${status} (code: ${resultCode})`)

        // Update payment record
        const { data: updatedPayment, error: updateError } = await supabaseClient
            .from('mpesa_payments')
            .update({
                merchant_request_id: merchantRequestId,
                status: status,
                result_code: resultCode.toString(),
                result_desc: resultDesc,
                mpesa_receipt_number: mpesaReceiptNumber,
                transaction_date: transactionDate,
                callback_data: stkCallback,
                updated_at: new Date().toISOString()
            })
            .eq('checkout_request_id', checkoutRequestId)
            .select()
            .single()

        if (updateError) {
            console.error('Failed to update payment:', updateError)
        } else {
            console.log('Payment updated successfully:', updatedPayment.id)

            // If payment successful and not yet vended, trigger vending
            if (status === 'success' && !updatedPayment.token_vended && updatedPayment.unit_id) {
                console.log('Triggering auto-vending for payment:', updatedPayment.id)

                // Get unit details for meter number
                const { data: unit } = await supabaseClient
                    .from('units')
                    .select('meter_number')
                    .eq('id', updatedPayment.unit_id)
                    .single()

                if (unit && unit.meter_number) {
                    // Fetch settings (service fee and tariff)
                    const { data: settingsData } = await supabaseClient
                        .from('admin_settings')
                        .select('key, value')
                        .in('key', ['service_fee_percent', 'tariff_ksh_per_kwh'])

                    const settings: Record<string, string> = {}
                    settingsData?.forEach((s: any) => settings[s.key] = s.value)

                    const serviceFeePercent = settings.service_fee_percent ? parseFloat(settings.service_fee_percent) : 5
                    const tariff = settings.tariff_ksh_per_kwh ? parseFloat(settings.tariff_ksh_per_kwh) : 28 // Default safely

                    const fee = updatedPayment.amount * (serviceFeePercent / 100)
                    const netAmount = updatedPayment.amount - fee

                    // Calculate estimated units to vend
                    // Futurise "money" field expects units when configured this way
                    const estimatedUnits = netAmount / tariff

                    console.log(`Vending Analysis: Amount=${updatedPayment.amount}, Net=${netAmount}, Tariff=${tariff}, Units=${estimatedUnits}`)

                    // Call vending function
                    try {
                        const vendRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/futurise-vend-token`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                action: 'vend',
                                meterNumber: unit.meter_number,
                                amount: estimatedUnits // Sending UNITS now, not KES
                            })
                        })

                        const vendData = await vendRes.json()
                        console.log('Vend Data Received:', JSON.stringify(vendData));

                        if (vendData.success && vendData.token) {
                            console.log('Token vended successfully:', vendData.token)

                            // Determine final units to save
                            // If API returns units, use them, otherwise fallback to what we calculated
                            const finalUnits = vendData.units || estimatedUnits

                            // Save to topups
                            const { data: topup } = await supabaseClient
                                .from('topups')
                                .insert({
                                    unit_id: updatedPayment.unit_id,
                                    tenant_id: updatedPayment.tenant_id,
                                    amount_paid: updatedPayment.amount,
                                    amount_vended: finalUnits, // Saving UNITS here as requested
                                    units_kwh: finalUnits,
                                    fee_amount: fee,
                                    payment_channel: 'mpesa',
                                    token: vendData.token,
                                    futurise_status: 'success',
                                    futurise_message: 'Token generated successfully',
                                    futurise_transaction_id: vendData.transactionId,
                                    mpesa_receipt_number: mpesaReceiptNumber
                                })
                                .select()
                                .single()

                            // Update payment record with topup reference
                            await supabaseClient
                                .from('mpesa_payments')
                                .update({
                                    token_vended: true,
                                    topup_id: topup.id
                                })
                                .eq('id', updatedPayment.id)

                            console.log('Auto-vending completed, topup created:', topup.id)

                            // --- SEND SMS NOTIFICATION (AFRICA'S TALKING) ---
                            try {
                                console.log('Attempting to send SMS...')
                                // 1. Get SMS Credentials and Template
                                const { data: smsCreds } = await supabaseClient
                                    .from('api_credentials')
                                    .select('credentials')
                                    .eq('service_name', 'africastalking')
                                    .single()

                                if (smsCreds && smsCreds.credentials) {
                                    const { username, api_key, sms_template, sender_id } = smsCreds.credentials

                                    if (username && api_key) {
                                        // 2. Prepare Message
                                        let message = sms_template || 'Token: {token}. Units: {units} KWh. Amount: KES {amount}. Meter: {meter}.'
                                        message = message.replace('{token}', vendData.token)
                                            .replace('{units}', parseFloat(finalUnits).toFixed(2))
                                            .replace('{amount}', updatedPayment.amount)
                                            .replace('{meter}', unit.meter_number)
                                            .replace('{name}', 'Customer') // You could fetch profile name if needed

                                        // 3. Send SMS via Africa's Talking API
                                        const atUrl = username === 'sandbox'
                                            ? 'https://api.sandbox.africastalking.com/version1/messaging'
                                            : 'https://api.africastalking.com/version1/messaging'

                                        // Format phone number - AT requires + prefix
                                        let smsPhone = updatedPayment.phone_number
                                        if (!smsPhone.startsWith('+')) {
                                            smsPhone = '+' + smsPhone
                                        }

                                        const formBody = new URLSearchParams()
                                        formBody.append('username', username)
                                        formBody.append('to', smsPhone) // Use formatted phone with +
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

                                        // Log SMS attempt to database
                                        const smsStatus = smsRes.ok && smsData.SMSMessageData ? 'success' : 'failed'
                                        const errorMsg = smsStatus === 'failed' ? (smsData.message || JSON.stringify(smsData)) : null

                                        await supabaseClient.from('sms_logs').insert({
                                            tenant_id: updatedPayment.tenant_id,
                                            phone_number: smsPhone,
                                            message: message,
                                            status: smsStatus,
                                            provider: 'africastalking',
                                            response_data: smsData,
                                            error_message: errorMsg,
                                            topup_id: topup.id
                                        })
                                    } else {
                                        console.log('SMS skipped: Missing username or api_key in settings')
                                        // Log skipped SMS
                                        await supabaseClient.from('sms_logs').insert({
                                            tenant_id: updatedPayment.tenant_id,
                                            phone_number: updatedPayment.phone_number || 'unknown',
                                            message: 'SMS skipped',
                                            status: 'skipped',
                                            provider: 'africastalking',
                                            error_message: 'Missing username or api_key in settings',
                                            topup_id: topup.id
                                        })
                                    }
                                } else {
                                    console.log('SMS skipped: No SMS configuration found in api_credentials')
                                    // Log skipped SMS
                                    await supabaseClient.from('sms_logs').insert({
                                        tenant_id: updatedPayment.tenant_id,
                                        phone_number: updatedPayment.phone_number || 'unknown',
                                        message: 'SMS skipped',
                                        status: 'skipped',
                                        provider: 'africastalking',
                                        error_message: 'No SMS configuration found in api_credentials',
                                        topup_id: topup.id
                                    })
                                }
                            } catch (smsError) {
                                console.error('Failed to send SMS:', smsError)
                                // Log failed SMS
                                try {
                                    await supabaseClient.from('sms_logs').insert({
                                        tenant_id: updatedPayment.tenant_id,
                                        phone_number: updatedPayment.phone_number || 'unknown',
                                        message: 'SMS failed',
                                        status: 'failed',
                                        provider: 'africastalking',
                                        error_message: smsError.message || String(smsError),
                                        topup_id: topup ? topup.id : null
                                    })
                                } catch (logError) {
                                    console.error('Failed to log SMS error:', logError)
                                }
                                // Do not throw, allow the process to finish successfully otherwise
                            }
                            // ------------------------------------------------

                        } else {
                            console.error('Vending failed:', vendData.message || vendData.error)
                        }
                    } catch (vendError) {
                        console.error('Error during auto-vending:', vendError)
                    }
                }
            }
        }

        return new Response(JSON.stringify({ result: "ok" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error) {
        console.error("Callback Error:", error)
        return new Response(JSON.stringify({ result: "ok" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })
    }
})
