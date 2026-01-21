/* 
  Final RLS Performance Fix for Events
  1. Resolves 'auth_rls_initplan' warning.
  2. Resolves 'multiple_permissive_policies' warning.
  3. Splits Read (Select) and Write (Insert/Update/Delete) policies.
*/

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop all previous attempts to ensure a clean slate
DROP POLICY IF EXISTS "Public_Read_Events_Opt" ON public.events;
DROP POLICY IF EXISTS "Admins_Manage_Events_Opt" ON public.events;
DROP POLICY IF EXISTS "Public Read Events" ON public.events;
DROP POLICY IF EXISTS "Admins Manage Events" ON public.events;
DROP POLICY IF EXISTS "Everyone can insert events" ON public.events;
DROP POLICY IF EXISTS "Public_View_Content" ON public.events;
DROP POLICY IF EXISTS "Admins_Del_Events" ON public.events;
DROP POLICY IF EXISTS "Admins_Write_Events" ON public.events;
DROP POLICY IF EXISTS "Admins_Mod_Events" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Write_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Events_Final" ON public.events;

/* 
  1. Single Permissive Policy for SELECT (Public)
  This covers both anonymous and authenticated users (including admins).
*/
CREATE POLICY "Public_Read_Events_Final"
ON public.events
FOR SELECT
USING (true);

/* 
  2. Restrictive/Permissive Policies for WRITES
  Using strictly separate policies for Insert/Update/Delete to avoid Select overlap.
  Auth checks are wrapped in (SELECT ...) to stabilize the query plan.
*/

-- INSERT Policy
CREATE POLICY "Admins_Insert_Events_Final"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (SELECT auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
);

-- UPDATE Policy
CREATE POLICY "Admins_Update_Events_Final"
ON public.events
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (SELECT auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
)
WITH CHECK (
  (SELECT auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (SELECT auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
);

-- DELETE Policy
CREATE POLICY "Admins_Delete_Events_Final"
ON public.events
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (SELECT auth.uid()) 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  )
);

-- Grant necessary permissions
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
