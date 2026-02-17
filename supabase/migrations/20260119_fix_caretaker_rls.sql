-- CARETAKER RLS POLICIES
-- Grant access to related tables based on property assignment

-- 1. UNITS
-- Caretakers can see units belonging to their assigned property
DROP POLICY IF EXISTS "Caretakers can view units" ON public.units;
CREATE POLICY "Caretakers can view units"
ON public.units
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = units.property_id
    AND p.caretaker_id = auth.uid()
  )
);

-- 2. UNIT ASSIGNMENTS (Tenants)
-- Caretakers can see assignments for units in their assigned property
DROP POLICY IF EXISTS "Caretakers can view assignments" ON public.unit_assignments;
CREATE POLICY "Caretakers can view assignments"
ON public.unit_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.properties p ON p.id = u.property_id
    WHERE u.id = unit_assignments.unit_id
    AND p.caretaker_id = auth.uid()
  )
);

-- 3. TOPUPS (Meters/Payments)
-- Caretakers can see topups for units in their assigned property
DROP POLICY IF EXISTS "Caretakers can view topups" ON public.topups;
CREATE POLICY "Caretakers can view topups"
ON public.topups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.properties p ON p.id = u.property_id
    WHERE u.id = topups.unit_id
    AND p.caretaker_id = auth.uid()
  )
);

-- 4. ISSUES
-- Caretakers can see/manage issues for their assigned property
DROP POLICY IF EXISTS "Caretakers can view issues" ON public.issues;
CREATE POLICY "Caretakers can view issues"
ON public.issues
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.properties p ON p.id = u.property_id
    WHERE u.id = issues.unit_id
    AND p.caretaker_id = auth.uid()
  )
);

-- Allow caretakers to update issues (e.g. mark as resolved)
DROP POLICY IF EXISTS "Caretakers can update issues" ON public.issues;
CREATE POLICY "Caretakers can update issues"
ON public.issues
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    JOIN public.properties p ON p.id = u.property_id
    WHERE u.id = issues.unit_id
    AND p.caretaker_id = auth.uid()
  )
);
