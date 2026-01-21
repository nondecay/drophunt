-- Optimize Events RLS: Fix performance warnings and duplicates

-- 1. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to clean up duplicates (Permissive & Restrictive)
DROP POLICY IF EXISTS "Public Read Events" ON public.events;
DROP POLICY IF EXISTS "Admins Manage Events" ON public.events;
DROP POLICY IF EXISTS "Everyone can insert events" ON public.events;
DROP POLICY IF EXISTS "Public_View_Content" ON public.events;
DROP POLICY IF EXISTS "Admins_Del_Events" ON public.events;
DROP POLICY IF EXISTS "Admins_Write_Events" ON public.events;
DROP POLICY IF EXISTS "Admins_Mod_Events" ON public.events;

-- 3. Optimized Read Policy (Public)
CREATE POLICY "Public_Read_Events_Opt"
ON public.events
FOR SELECT
USING (true);

-- 4. Optimized Write Policy (Admins)
-- Wrap auth calls in (select ...) to avoid per-row re-evaluation (initplan optimization)
-- Using a subquery for the Admin check to ensure it's evaluated once per query if possible
CREATE POLICY "Admins_Manage_Events_Opt"
ON public.events
FOR ALL
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = (SELECT auth.uid()) 
    AND (public.users.role = 'admin' OR public.users."memberStatus" = 'Admin')
  )
);

-- 5. Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;

-- Verification:
-- The 'initplan' warning suggests avoiding `auth.uid()` or `current_setting` in the row check directly if complex.
-- Wrapping `(SELECT auth.uid())` helps Postgres treat it as a stable value for the query.
