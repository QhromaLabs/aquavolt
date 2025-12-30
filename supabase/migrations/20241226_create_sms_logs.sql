-- Create SMS logs table for tracking all SMS notification attempts
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  provider TEXT DEFAULT 'africastalking',
  response_data JSONB,
  error_message TEXT,
  topup_id UUID REFERENCES topups(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at DESC);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_tenant_id ON sms_logs(tenant_id);

-- Enable RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all SMS logs
CREATE POLICY "Admins can view all SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Service role can insert SMS logs (for Edge Functions)
CREATE POLICY "Service role can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
