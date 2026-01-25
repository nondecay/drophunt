-- SECURE EVENTS TABLE (LOCKDOWN)
-- Since we are using a Secure RPC Function ('create_admin_event') for writes,
-- we can now completely LOCK the 'events' table against direct modifications.
-- This satisfies the "Strict Security" requirement.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 1. DROP ALL EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Public_Read_Absolute" ON public.events;
DROP POLICY IF EXISTS "SuperAdmin_Insert" ON public.events;
DROP POLICY IF EXISTS "SuperAdmin_Update" ON public.events;
DROP POLICY IF EXISTS "SuperAdmin_Delete" ON public.events;
-- Drop any other stragglers
DROP POLICY IF EXISTS "Public_Read_All" ON public.events;
DROP POLICY IF EXISTS "Strict_Admin_Insert_Only" ON public.events;
DROP POLICY IF EXISTS "Strict_Admin_Mod_Only" ON public.events;

-- 2. PUBLIC READ (Allowed)
CREATE POLICY "Public_Read_Events"
ON public.events 
FOR SELECT 
USING (true);

-- 3. WRITE ACCESS (DENIED for all Direct Table Access)
-- We do NOT create any INSERT/UPDATE/DELETE policies.
-- By default in RLS, if no policy grants permission, it is DENIED.
-- Only the 'create_admin_event' function (SECURITY DEFINER) can bypass this.
-- This is the highest level of security.

-- Optional: Comments/Guides/Votes table handling (Leaving them as is for now)
