-- Allow Admins to View All Requests
CREATE POLICY "Admins can view all withdrawal requests"
    ON withdrawal_requests
    FOR SELECT
    USING (public.is_admin());

-- Allow Admins to Update Status (Approve/Reject)
CREATE POLICY "Admins can update withdrawal requests"
    ON withdrawal_requests
    FOR UPDATE
    USING (public.is_admin());
