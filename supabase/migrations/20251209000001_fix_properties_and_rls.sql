-- 1. Fix Properties FK: Change from auth.users to public.profiles for easier joining
ALTER TABLE public.properties DROP COLUMN IF EXISTS agent_id;
ALTER TABLE public.properties ADD COLUMN agent_id uuid REFERENCES public.profiles(id);

-- 2. Create Security Definer function to check admin status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Profiles RLS Policy
-- Allow users to see their own profile AND Admins to see EVERYONE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "View profiles policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
);

-- 4. Ensure Admin can also Update/Delete for User Management
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( public.is_admin() );

-- (Optional) If you want admins to delete users (careful with cascading)
-- CREATE POLICY "Admins can delete profiles" ON ...
