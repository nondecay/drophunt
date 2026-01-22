-- FIX: USERS TABLE READ ACCESS (Hunter Count)
-- If the count is 0 or not loading, it's likely RLS preventing 'select * from users'.

-- 1. Enable RLS (if not already)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Read Access (Safe for profiles, assuming email is private or not in this table, or we accept public profiles)
-- Note: 'users' table usually contains public profile info like username, avatar. 
-- Sensitive data like email should be in auth.users or a separate private table if strict privacy needed.
-- For this app, it seems public profiles are intended.

DROP POLICY IF EXISTS "Public_Read_Users" ON public.users;

CREATE POLICY "Public_Read_Users"
ON public.users
FOR SELECT
TO public
USING (true);

-- 3. Verify Count
SELECT count(*) as total_hunters FROM public.users;
