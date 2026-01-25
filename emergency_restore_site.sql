-- EMERGENCY RESTORE
-- 1. Restore Public Read Access to Users (Fixes "Whole Site Broken" / Login issues)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public_Read_Users" ON public.users;
CREATE POLICY "Public_Read_Users" ON public.users FOR SELECT USING (true);

-- 2. Restore Basic Access to Comments (Fixes "Comments not loading")
DROP POLICY IF EXISTS "Public_Read_Comments" ON public.comments;
CREATE POLICY "Public_Read_Comments" ON public.comments FOR SELECT USING (true);

-- 3. Fix the Admin Check Function (Safe Version)
-- This ensures 'is_admin_safe' exists and doesn't error out, allowing RLS to work.
-- Removed email check to prevent "column does not exist" error.

CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
$$;

-- Overload for zero-arguments (Auth UID)
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin_safe(auth.uid());
$$;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.is_admin_safe(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated, anon;

-- 5. Fix Comments Update Policy (So Admin can Approve)
DROP POLICY IF EXISTS "Admins_Update_Comments" ON public.comments;
CREATE POLICY "Admins_Update_Comments" 
ON public.comments 
FOR UPDATE 
TO authenticated
USING ( public.is_admin_safe(auth.uid()) )
WITH CHECK ( public.is_admin_safe(auth.uid()) );

