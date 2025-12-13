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
                    // Calculate service fee (get from settings)
                    const { data: settings } = await supabaseClient
                        .from('admin_settings')
                        .select('value')
                        .eq('key', 'service_fee_percent')
                        .single()

                    const serviceFeePercent = settings?.value ? parseFloat(settings.value) : 5
                    const fee = updatedPayment.amount * (serviceFeePercent / 100)
                    const netAmount = updatedPayment.amount - fee

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
                                amount: netAmount
                            })
                        })

                        const vendData = await vendRes.json()
                        console.log('Vend Data Received:', JSON.stringify(vendData));

                        if (vendData.success && vendData.token) {
                            console.log('Token vended successfully:', vendData.token)

                            // Save to topups
                            const { data: topup } = await supabaseClient
                                .from('topups')
                                .insert({
                                    unit_id: updatedPayment.unit_id,
                                    tenant_id: updatedPayment.tenant_id,
                                    amount_paid: updatedPayment.amount,
                                    amount_vended: vendData.units || netAmount,
                                    units_kwh: vendData.units,
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
