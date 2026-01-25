-- FINAL PURE RLS FIX
-- 1. Updates is_admin_safe to REMOVE email checks (as requested).
-- 2. Uses explicit ::text casting to solve UUID/Text mismatches between auth.uid() and users.id.
-- 3. Re-applies strict policies to ensure they use the updated function.

CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = auth.uid()::text 
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  );
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO anon;

-- Re-apply Policies to be absolutely sure they are active and using the new function
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop verify rebuilds
DROP POLICY IF EXISTS "Admins_Insert_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Strict" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Strict" ON public.events;

-- READ: Everyone
CREATE POLICY "Public_Read_Strict"
ON public.events
FOR SELECT
USING (true);

-- WRITE: Admins Only
CREATE POLICY "Admins_Insert_Strict"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK ( public.is_admin_safe() );

CREATE POLICY "Admins_Update_Strict"
ON public.events
FOR UPDATE
TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );

CREATE POLICY "Admins_Delete_Strict"
ON public.events
FOR DELETE
TO authenticated
USING ( public.is_admin_safe() );
