/* 
  Final RLS Performance Fix (V2) - Function Base Approach
  Using a STABLE function is the most reliable way to resolve 'auth_rls_initplan'
  warnings for complex conditions involving auth.uid() and table lookups.
*/

-- 1. Create a STABLE function to encapsulate the check
-- STABLE tells Postgres this function yields the same result for the same query/transaction,
-- allowing it to be evaluated once (InitPlan) rather than for every row.
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      -- 1. Check Email Claim (Fastest) in a way that respects nulls
      coalesce(auth.jwt() ->> 'email', '') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
    )
    OR
    (
      -- 2. Check DB Role
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (role = 'admin' OR "memberStatus" = 'Admin')
      )
    );
$$;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop previous policies
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
DROP POLICY IF EXISTS "Admins_Insert_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Write_Events_Final" ON public.events; -- cleanup just in case

-- 1. Public Read Policy
CREATE POLICY "Public_Read_Events_Final_v2"
ON public.events
FOR SELECT
USING (true);

-- 2. Admin Write Policies using the STABLE function
-- This creates a very clean execution plan.

CREATE POLICY "Admins_Insert_Events_Final_v2"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK ( public.is_admin_safe() );

CREATE POLICY "Admins_Update_Events_Final_v2"
ON public.events
FOR UPDATE
TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );

CREATE POLICY "Admins_Delete_Events_Final_v2"
ON public.events
FOR DELETE
TO authenticated
USING ( public.is_admin_safe() );

-- Grant permissions
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO anon; -- Just in case needed for other checks
