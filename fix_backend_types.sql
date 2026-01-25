-- FIX BACKEND TYPE MISMATCH
-- The error "RLS violation" is likely caused by a Data Type Mismatch between:
-- 1. The 'auth.uid()' (which acts as a UUID)
-- 2. The 'users.id' (which might be Text or UUID)

-- This script forces them to match by casting both to TEXT. 
-- It is the only way to guarantee they compare correctly.

CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = auth.uid()::text -- FORCE MATCH TYPES
    AND (role = 'admin' OR "memberStatus" = 'Admin')
  );
$$;

-- Grant permissions (Crucial)
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO anon;

-- FLUSH and RELOAD Policies to ensure they use the new function
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins_Insert_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Strict" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Strict" ON public.events;

-- READ: Everyone
CREATE POLICY "Public_Read_Strict" ON public.events FOR SELECT USING (true);

-- WRITE: Admins Only (Using the fixed function)
CREATE POLICY "Admins_Insert_Strict" ON public.events FOR INSERT TO authenticated WITH CHECK ( public.is_admin_safe() );
CREATE POLICY "Admins_Update_Strict" ON public.events FOR UPDATE TO authenticated USING ( public.is_admin_safe() ) WITH CHECK ( public.is_admin_safe() );
CREATE POLICY "Admins_Delete_Strict" ON public.events FOR DELETE TO authenticated USING ( public.is_admin_safe() );
