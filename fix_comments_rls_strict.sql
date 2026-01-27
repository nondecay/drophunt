-- FIX COMMENTS RLS STRICT (FINAL OPTIMIZED)
-- Addresses:
-- 1. "Update not saving" (RLS filtering out the row)
-- 2. "Multiple Permissive Policies" (Optimization)
-- 3. "Function Search Path Mutable" (Security)
-- 4. "Auth RLS Init Plan" (Performance)

-- 1. CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Unified_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Unified_Comments_Delete" ON public.comments;
DROP POLICY IF EXISTS "Unified_Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Unified_Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Update_Admin" ON public.comments;
DROP POLICY IF EXISTS "Comments_Update_Owner" ON public.comments;
DROP POLICY IF EXISTS "Owner_Update_Comments" ON public.comments;
DROP POLICY IF EXISTS "Admins_Update_Comments" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Delete" ON public.comments;

-- 2. HELPER FUNCTION (Secure & Optimized)
-- We strictly define what an "Admin" is for RLS purposes
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public -- Fix: function_search_path_mutable
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (select auth.uid()) -- Optimization match
    AND (
        role = 'admin' 
        OR 
        "memberStatus" IN ('Admin', 'Super Admin')
    )
  );
END;
$$;

-- 3. CREATE STRICT POLICIES

-- A. SELECT: Public
CREATE POLICY "Strict_Comments_Select" ON public.comments FOR SELECT USING (true);

-- B. INSERT: Authenticated
-- Fix: auth_rls_initplan using (select auth.role())
CREATE POLICY "Strict_Comments_Insert" ON public.comments FOR INSERT WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- C. UPDATE: Admin OR Owner
-- Fix: auth_rls_initplan using (select auth.uid()) and secure function
CREATE POLICY "Strict_Comments_Update" ON public.comments FOR UPDATE USING (
    (select public.is_admin_check())
    OR
    address = (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- D. DELETE: Admin OR Owner
-- Fix: auth_rls_initplan using (select auth.uid()) and secure function
CREATE POLICY "Strict_Comments_Delete" ON public.comments FOR DELETE USING (
    (select public.is_admin_check())
    OR
    address = (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- 4. FORCE RELOAD
NOTIFY pgrst, 'reload schema';
