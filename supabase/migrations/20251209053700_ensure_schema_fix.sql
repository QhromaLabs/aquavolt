-- Ensure profiles table has necessary columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'tenant';

-- Check if unit_assignments table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.unit_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.profiles(id),
    unit_id UUID REFERENCES public.units(id),
    status TEXT DEFAULT 'active', -- active, moved_out
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled on unit_assignments
ALTER TABLE public.unit_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for unit_assignments (Admins can view all)
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.unit_assignments;
CREATE POLICY "Admins can view all assignments"
ON public.unit_assignments
FOR SELECT
TO authenticated
USING ( public.is_admin() );

-- Policy for unit_assignments (Admins can insert/update)
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.unit_assignments;
CREATE POLICY "Admins can manage assignments"
ON public.unit_assignments
FOR ALL
TO authenticated
USING ( public.is_admin() );

-- Ensure properties has landlord_id
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.profiles(id);

-- Verify policies for properties
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
CREATE POLICY "Admins can manage properties"
ON public.properties
FOR ALL
TO authenticated
USING ( public.is_admin() );
