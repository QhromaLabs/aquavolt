-- Enable RLS on the table
ALTER TABLE mpesa_payments ENABLE ROW LEVEL SECURITY;

-- 1. Grant Service Role full access (for Edge Functions)
-- This allows the mpesa-stk-push and mpesa-callback functions to insert/update records
CREATE POLICY "Service Role Full Access" ON mpesa_payments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Grant Tenants read access to their own payments
-- This allows the polling mechanism in BuyToken.jsx to work
CREATE POLICY "Tenants View Own Payments" ON mpesa_payments
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = auth.uid()
    );

-- Optional: If tenant_id is null (e.g. guest checkout?), fallback to phone number matching
-- (Only if you store user phone in profiles and it is verified)
-- CREATE POLICY "Tenants View Own Payments by Phone" ON mpesa_payments
--     FOR SELECT
--     TO authenticated
--     USING (
--         phone_number IN (SELECT phone FROM profiles WHERE id = auth.uid())
--     );
