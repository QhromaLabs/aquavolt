-- Add caretaker_id to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS caretaker_id UUID REFERENCES public.profiles(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_properties_caretaker_id ON public.properties(caretaker_id);

-- RLS Policy: Allow Caretakers to view their assigned property
-- Note: 'properties' table generally has RLS enabled.
-- We need to check if existing policies conflict, but usually adding a new "ON SELECT" policy is safe (OR logic).

DROP POLICY IF EXISTS "Caretakers can view assigned property" ON public.properties;

CREATE POLICY "Caretakers can view assigned property"
ON public.properties
FOR SELECT
TO authenticated
USING (
  caretaker_id = auth.uid() 
  OR 
  (public.is_admin()) -- Keep admin access just in case
);
