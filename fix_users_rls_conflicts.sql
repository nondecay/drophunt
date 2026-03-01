-- FIX USERS RLS CONFLICTS & OPTIMIZATION
-- 1. Drops conflicting duplicate policies ("Unified_Users_Update" vs "Users can update own profile")
-- 2. Creates a single, optimized policy using (select auth.uid()) for performance caching.
-- 3. Includes Admin override support via public.is_admin_check().

-- Drop known conflicting policies
DROP POLICY IF EXISTS "Unified_Users_Update" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can edit own profile" ON public.users; -- Potential legacy name

-- Create Single Optimized Policy
-- Uses (select auth.uid()) to prevent re-evaluation per row (InitPlan optimization)
CREATE POLICY "Users_Update_Optimized" ON public.users 
FOR UPDATE USING (
    (select auth.uid()) = id
    OR
    (select public.is_admin_check())
);

-- Ensure Insert/Select policies are also sane (Optional but good hygiene)
-- We won't touch them unless requested to avoid side-effects, 
-- but we ensure the Update path is now singular and clean.

-- Reload Schema
NOTIFY pgrst, 'reload schema';
