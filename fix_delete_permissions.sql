-- 1. Fix M-Pesa Payments RLS
DROP POLICY IF EXISTS "Admins can view all mpesa_payments" ON mpesa_payments;
DROP POLICY IF EXISTS "Admins can delete mpesa_payments" ON mpesa_payments;

CREATE POLICY "Admins can view all mpesa_payments"
ON mpesa_payments
FOR SELECT
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete mpesa_payments"
ON mpesa_payments
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 2. Fix Commissions RLS
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can delete commissions" ON commissions;

CREATE POLICY "Admins can view all commissions"
ON commissions
FOR SELECT
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete commissions"
ON commissions
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 3. Fix SMS Logs RLS
DROP POLICY IF EXISTS "Admins can view all sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "Admins can delete sms_logs" ON sms_logs;

CREATE POLICY "Admins can view all sms_logs"
ON sms_logs
FOR SELECT
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete sms_logs"
ON sms_logs
FOR DELETE
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
