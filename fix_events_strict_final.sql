/* 
  Final Secure & Performant RLS for Events
  
  Resolves:
  1. "RLS Policy Always True" security warnings (by enforcing admin check).
  2. "Auth RLS InitPlan" performance warnings (by using STABLE function).
  3. "Multiple Permissive Policies" warnings (by splitting Read/Write).
*/

-- 1. Ensure the STABLE check function exists and is robust
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      -- Whitelist for unshakeable access
      coalesce(auth.jwt() ->> 'email', '') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
    )
    OR
    (
      -- Database Role Check
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (role = 'admin' OR "memberStatus" = 'Admin')
      )
    );
$$;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Clean up ALL previous policies (Permissive & Strict)
DROP POLICY IF EXISTS "Authenticated_Insert_Events_Permissive" ON public.events;
DROP POLICY IF EXISTS "Authenticated_Update_Events_Permissive" ON public.events;
DROP POLICY IF EXISTS "Authenticated_Delete_Events_Permissive" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Events_Final_v2" ON public.events;
DROP POLICY IF EXISTS "Admins_Insert_Events_Final_v2" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Events_Final_v2" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Events_Final_v2" ON public.events;
-- Cleanup older names just in case
DROP POLICY IF EXISTS "Admins_Insert_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Events_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Events_Final" ON public.events;

-- 3. Strict Policies

-- READ: Everyone (Public)
CREATE POLICY "Public_Read_Strict"
ON public.events
FOR SELECT
USING (true);

-- INSERT: Admins Only (Strict)
CREATE POLICY "Admins_Insert_Strict"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK ( public.is_admin_safe() );

-- UPDATE: Admins Only (Strict)
CREATE POLICY "Admins_Update_Strict"
ON public.events
FOR UPDATE
TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );

-- DELETE: Admins Only (Strict)
CREATE POLICY "Admins_Delete_Strict"
ON public.events
FOR DELETE
TO authenticated
USING ( public.is_admin_safe() );

-- 4. Permissions
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO anon;
