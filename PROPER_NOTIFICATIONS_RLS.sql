-- PROPER NOTIFICATIONS RLS POLICY
-- This matches the method used for "airdrops" and other tables where "public.is_admin()" is used to check for admin privileges.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public notifications access" ON public.notifications;
DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

-- 2. Create the SELECT policy (Viewable by everyone)
CREATE POLICY "Notifications are viewable by everyone" 
ON public.notifications FOR SELECT 
USING (true);

-- 3. Create the INSERT/UPDATE/DELETE policy using public.is_admin()
CREATE POLICY "Admins can manage notifications" 
ON public.notifications FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());
