-- FIX ADMIN ABILITY TO UPDATE USERS TABLE & REDEFINE IS_ADMIN FUNCTION
-- This ensures 'Admin' and 'Super Admin' memberStatus are recognized as admins.

-- 1. Redefine is_admin() to check both role AND memberStatus
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing RLS policies on users table meant for admins
DROP POLICY IF EXISTS "Admins can update everything" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- 3. Recreate the policy using the updated is_admin() function
CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Also ensure Admins can see all users (if not already public)
-- (Users are public by default based on earlier schema, but just in case)
DROP POLICY IF EXISTS "Admins can view users" ON public.users;
CREATE POLICY "Admins can view users" 
ON public.users 
FOR SELECT 
USING (public.is_admin());
