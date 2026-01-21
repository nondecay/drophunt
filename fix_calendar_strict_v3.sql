-- FIX: STRICT ADMIN ACCESS + PERFORMANCE + TYPE SAFETY
-- 1. STABLE Function: Caches result, solves "auth_rls_initplan" warning.
-- 2. Explicit Casting: (id::text = auth.uid()::text) solves UUID vs Text mismatch.
-- 3. Strict Policies: Only Admins can INSERT/UPDATE/DELETE.

-- Create STABLE Admin Check Function
CREATE OR REPLACE FUNCTION public.get_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = (select auth.uid())::text  -- Solves Backend Mismatch
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
$$;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.get_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_is_admin TO anon;

-- RESET POLICIES
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Clean old permissive/broken policies
DROP POLICY IF EXISTS "Auth_Insert_Simple" ON public.events;
DROP POLICY IF EXISTS "Auth_Update_Simple" ON public.events;
DROP POLICY IF EXISTS "Auth_Delete_Simple" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Simple" ON public.events;
DROP POLICY IF EXISTS "Admins_Insert_Perf" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Perf" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Perf" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Perf" ON public.events;

-- READ: Everyone
CREATE POLICY "Public_Read_Final"
ON public.events 
FOR SELECT 
USING (true);

-- WRITE (INSERT): Admins Only
CREATE POLICY "Admins_Insert_Final"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK ( public.get_is_admin() );

-- WRITE (UPDATE): Admins Only
CREATE POLICY "Admins_Update_Final"
ON public.events
FOR UPDATE
TO authenticated
USING ( public.get_is_admin() )
WITH CHECK ( public.get_is_admin() );

-- WRITE (DELETE): Admins Only
CREATE POLICY "Admins_Delete_Final"
ON public.events
FOR DELETE
TO authenticated
USING ( public.get_is_admin() );
