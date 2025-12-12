// PAYMENT POLLING FIX - Replace lines 105-190 in BuyToken.jsx

// [REAL FLOW] M-Pesa callback auto-vending with real-time polling
// 1. STK Push (Safaricom Production)
message.loading({ content: 'Sending M-Pesa STK Push...', key: 'mpesa' });
const stkRes = await futuriseDev.sendStkPush(phone, values.amount, values.unit_id, (await supabase.auth.getUser()).data.user.id);

if (!stkRes.success) {
    message.error({ content: 'STK Push Failed: ' + stkRes.message, key: 'mpesa' });
    setPaymentStatus('error');
    throw new Error(stkRes.message);
}

const checkoutRequestId = stkRes.checkoutRequestId;
message.success({ content: 'STK Push Sent! Enter PIN on your phone.', key: 'mpesa', duration: 4 });
setPaymentStatus('waiting');

// 2. Poll for payment confirmation (callback updates database)
message.loading({ content: 'Waiting for payment confirmation...', key: 'payment_wait', duration: 0 });

const maxAttempts = 90; // Poll for up to 90 seconds
let attempts = 0;
let paymentConfirmed = false;

while (attempts < maxAttempts && !paymentConfirmed) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    attempts++;

    // Check payment status in database
    const { data: payment, error } = await supabase
        .from('mpesa_payments')
        .select('*, topups(*)')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

    if (error) {
        console.error('Error checking payment:', error);
        continue;
    }

    if (payment.status === 'success') {
        // Payment succeeded!
        if (payment.token_vended && payment.topups) {
            // Token already vended by M-Pesa callback
            paymentConfirmed = true;
            message.success({ content: 'Payment confirmed! Token generated.', key: 'payment_wait' });
            setPaymentStatus('vended');

            const topup = payment.topups;
            setTokenResult({
                token: topup.token,
                amount_paid: payment.amount,
                units_kwh: topup.units_kwh || 0,
                meter_number: selectedUnitData.meterNumber,
                transaction_id: topup.id,
                receipt_number: payment.mpesa_receipt_number,
                transaction_date: topup.created_at
            });
            setShowSuccessModal(true);
            form.resetFields();
        } else {
            // Payment succeeded but vending still processing
            message.loading({ content: `Payment confirmed! Generating token... (${attempts}s)`, key: 'payment_wait', duration: 0 });
        }
    } else if (payment.status === 'failed') {
        message.error({ content: 'Payment failed: ' + payment.result_desc, key: 'payment_wait' });
        setPaymentStatus('error');
        break;
    } else if (payment.status === 'cancelled') {
        message.warning({ content: 'Payment cancelled', key: 'payment_wait' });
        setPaymentStatus('error');
        break;
    } else if (payment.status === 'timeout') {
        message.error({ content: 'Payment timed out', key: 'payment_wait' });
        setPaymentStatus('error');
        break;
    }
}

if (!paymentConfirmed && attempts >= maxAttempts) {
    message.error({ content: 'Verification timeout. Check Purchase History for updates.', key: 'payment_wait' });
    setPaymentStatus('error');
    throw new Error('Payment verification timeout');
}
