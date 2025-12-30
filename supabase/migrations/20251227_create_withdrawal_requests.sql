-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    mpesa_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Landlords can view their own requests"
    ON withdrawal_requests
    FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert requests"
    ON withdrawal_requests
    FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);

-- Admins (service role or specialized admin role) usually bypass RLS, but if there's an admin role:
-- We'll assume for now standard users can only see their own.
