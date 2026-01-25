-- FIX: STANDARD RLS SECURITY (No RPC Bypass)

-- 1. Helper Function for RLS (Optimized & Secure)
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Must be security definer to look up users table
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
$$;

-- 2. COMMENTS TABLE SECURITY
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow Public Read
DROP POLICY IF EXISTS "Public_Read_Comments" ON public.comments;
CREATE POLICY "Public_Read_Comments" ON public.comments FOR SELECT USING (true);

-- Allow Admins to UPDATE (Approve)
DROP POLICY IF EXISTS "Admins_Update_Comments" ON public.comments;
CREATE POLICY "Admins_Update_Comments" ON public.comments FOR UPDATE TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );

-- Allow Admins to DELETE
DROP POLICY IF EXISTS "Admins_Delete_Comments" ON public.comments;
CREATE POLICY "Admins_Delete_Comments" ON public.comments FOR DELETE TO authenticated
USING ( public.is_admin_safe() );


-- 3. AIRDROPS TABLE SECURITY (For Rating Updates)
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;

-- Allow Admins to UPDATE (e.g. Ratings)
DROP POLICY IF EXISTS "Admins_Update_Airdrops" ON public.airdrops;
CREATE POLICY "Admins_Update_Airdrops" ON public.airdrops FOR UPDATE TO authenticated
USING ( public.is_admin_safe() )
WITH CHECK ( public.is_admin_safe() );

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO anon;
