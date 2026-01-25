-- OPTIMIZE RLS PERFORMANCE & CLEANUP
-- Fixes: auth_rls_initplan (Performance) & multiple_permissive_policies (Redundancy)

-- ========================================================
-- 1. USERS TABLE OPTIMIZATION
-- ========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop ALL potential duplicate/redundant policies
DROP POLICY IF EXISTS "Public_Read_Users" ON public.users;
DROP POLICY IF EXISTS "Public_Read_Users_Emergency" ON public.users;
DROP POLICY IF EXISTS "Authenticated_Read_All" ON public.users;
DROP POLICY IF EXISTS "Allow All Select" ON public.users;

DROP POLICY IF EXISTS "Self_Update_Users" ON public.users;
DROP POLICY IF EXISTS "Users_Update_Self" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins_Update_Users" ON public.users;

DROP POLICY IF EXISTS "Self_Insert_Users" ON public.users;

-- CREATE SINGLE, OPTIMIZED POLICIES
-- Read: Everyone (Public) - Simple boolean, no auth call needed
CREATE POLICY "Public_Read_Users_Opt"
ON public.users
FOR SELECT
USING (true);

-- Update: Self Only - Use (select auth.uid()) for InitPlan optimization
CREATE POLICY "Self_Update_Users_Opt"
ON public.users
FOR UPDATE
USING ( id = (select auth.uid()) )
WITH CHECK ( id = (select auth.uid()) );

-- Insert: Self Only
CREATE POLICY "Self_Insert_Users_Opt"
ON public.users
FOR INSERT
WITH CHECK ( id = (select auth.uid()) );


-- ========================================================
-- 2. AIRDROPS TABLE OPTIMIZATION
-- ========================================================
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;

-- Drop duplicates
DROP POLICY IF EXISTS "Public_Read_Airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Public_Read_airdrops" ON public.airdrops;

DROP POLICY IF EXISTS "Admins_Update_Airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Admin_Update_airdrops" ON public.airdrops;

-- Create Optimized Policies
-- Read: Everyone
CREATE POLICY "Public_Read_Airdrops_Opt"
ON public.airdrops
FOR SELECT
USING (true);

-- Update: Admins Only (Optimized function call)
-- is_admin_safe() is already STABLE, which is good for performance.
CREATE POLICY "Admins_Update_Airdrops_Opt"
ON public.airdrops
FOR UPDATE
TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );


-- ========================================================
-- 3. COMMENTS TABLE OPTIMIZATION
-- ========================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop duplicates
DROP POLICY IF EXISTS "Public_Read_Comments" ON public.comments;
DROP POLICY IF EXISTS "Admins_Update_Comments" ON public.comments;
DROP POLICY IF EXISTS "Owner_Update_Comments" ON public.comments;
DROP POLICY IF EXISTS "Admins_Delete_Comments" ON public.comments;
DROP POLICY IF EXISTS "Owner_Delete_Comments" ON public.comments;

-- Create Optimized Policies
-- Read: Everyone
CREATE POLICY "Public_Read_Comments_Opt"
ON public.comments
FOR SELECT
USING (true);

-- Update: Admins Only (Approve)
CREATE POLICY "Admins_Update_Comments_Opt"
ON public.comments
FOR UPDATE
TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );

-- Delete: Admins Only
CREATE POLICY "Admins_Delete_Comments_Opt"
ON public.comments
FOR DELETE
TO authenticated
USING ( public.is_admin_safe() );


-- ========================================================
-- 4. FUNCTION PERFORMANCE CHECK
-- Ensure is_admin_safe is STABLE (cached per statement) not VOLATILE
-- ========================================================
CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- CRITICAL FOR PERFORMANCE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- CRITICAL FOR PERFORMANCE
SET search_path = public
AS $$
BEGIN
  RETURN public.is_admin_safe((select auth.uid())); -- InitPlan optimized
END;
$$;
