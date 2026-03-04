-- FIX ADMIN ABILITY TO UPDATE USERS TABLE
-- Admins need to be able to change memberStatus of users via the AdminPanel

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update everything" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- Create a robust policy using the already existing is_admin function
CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
