-- Final RLS Performance Fix for Events
-- 1. Resolve 'auth_rls_initplan' by properly wrapping auth calls.
-- 2. Resolve 'multiple_permissive_policies' by splitting Read (Select) and Write (Insert/Update/Delete).

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop all previous attempts
DROP POLICY IF EXISTS "Public_Read_Events_Opt" ON public.events;
DROP POLICY IF EXISTS "Admins_Manage_Events_Opt" ON public.events;
DROP POLICY IF EXISTS "Public Read Events" ON public.events;
DROP POLICY IF EXISTS "Admins Manage Events" ON public.events;
DROP POLICY IF EXISTS "Everyone can insert events" ON public.events;
DROP POLICY IF EXISTS "Public_View_Content" ON public.events;
DROP POLICY IF EXISTS "Admins_Del_Events" ON public.events;
DROP POLICY IF EXISTS "Admins_Write_Events" ON public.events;
DROP POLICY IF EXISTS "Admins_Mod_Events" ON public.events;

-- 1. Single Permissive Policy for SELECT (Public)
-- This covers authenticated admins too, so they don't need another SELECT policy.
CREATE POLICY "Public_Read_Events_Final"
ON public.events
FOR SELECT
USING (true);

-- 2. Restrictive/Permissive Policy for WRITE (Insert, Update, Delete) ONLY
-- This avoids overlap with SELECT.
-- wrapped auth functions in (select ...) for initplan stability
CREATE POLICY "Admins_Write_Events_Final"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Hardcoded emails for stability avoiding DB lookup if possible, or simplified check
  (select auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (select auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
);

CREATE POLICY "Admins_Update_Events_Final"
ON public.events
FOR UPDATE
TO authenticated
USING (
  (select auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (select auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
)
WITH CHECK (
  (select auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (select auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
);

CREATE POLICY "Admins_Delete_Events_Final"
ON public.events
FOR DELETE
TO authenticated
USING (
  (select auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (select auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
);

-- Grant permissions explicitly
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;

-- Force schema cache refresh if needed (usually handled by client restart)
