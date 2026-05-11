-- 1. Ensure the profiles table has the correct structure and RLS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'tenant';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Allow Landlords to see and manage their tenants' profiles
CREATE POLICY "Landlords can view profiles of their tenants" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.unit_assignments ua
    JOIN public.units u ON ua.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE ua.tenant_id = public.profiles.id 
    AND p.landlord_id = auth.uid()
  )
);

-- 3. Unit Assignments Security
ALTER TABLE public.unit_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage assignments for their properties"
ON public.unit_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE u.id = public.unit_assignments.unit_id
    AND p.landlord_id = auth.uid()
  )
);

-- 4. Units Security
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_status_check;
ALTER TABLE public.units ADD CONSTRAINT units_status_check CHECK (status IN ('vacant', 'active'));

CREATE POLICY "Landlords can update unit status"
ON public.units FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = public.units.property_id
    AND p.landlord_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = public.units.property_id
    AND p.landlord_id = auth.uid()
  )
);
