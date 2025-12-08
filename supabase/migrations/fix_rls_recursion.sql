-- Fix infinite recursion in unit_assignments RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Landlords can view assignments in their properties" ON unit_assignments;

-- Recreate with fixed query (no circular JOIN)
CREATE POLICY "Landlords can view assignments in their properties"
  ON unit_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = (SELECT property_id FROM units WHERE units.id = unit_assignments.unit_id)
      AND properties.landlord_id = auth.uid()
    )
  );
