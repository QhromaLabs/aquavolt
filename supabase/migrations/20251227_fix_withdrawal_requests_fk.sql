-- Fix FK to reference profiles instead of auth.users
ALTER TABLE withdrawal_requests
  DROP CONSTRAINT withdrawal_requests_landlord_id_fkey,
  ADD CONSTRAINT withdrawal_requests_landlord_id_fkey
    FOREIGN KEY (landlord_id)
    REFERENCES public.profiles(id);
