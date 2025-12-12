-- M-Pesa Payment Tracking Table
CREATE TABLE IF NOT EXISTS mpesa_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id TEXT UNIQUE NOT NULL,
  merchant_request_id TEXT,
  phone_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  unit_id UUID REFERENCES units(id),
  tenant_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, cancelled, timeout
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMP,
  result_code TEXT,
  result_desc TEXT,
  callback_data JSONB,
  token_vended BOOLEAN DEFAULT FALSE,
  topup_id UUID REFERENCES topups(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_checkout ON mpesa_payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_status ON mpesa_payments(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_tenant ON mpesa_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_pending ON mpesa_payments(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE mpesa_payments ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own payments
CREATE POLICY "Tenants can view own payments"
  ON mpesa_payments FOR SELECT
  USING (auth.uid() = tenant_id);

-- Service role can do everything
CREATE POLICY "Service role full access"
  ON mpesa_payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_mpesa_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mpesa_payment_timestamp
  BEFORE UPDATE ON mpesa_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_mpesa_payment_timestamp();
