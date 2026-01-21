-- Fix Calendar RLS: Allow authenticated users (Admins) to INSERT events.
-- The previous policy might be defaulting to deny or only allowing SELECT.

-- 1. Enable RLS on events if not already
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies for events
DROP POLICY IF EXISTS "Public Read Events" ON public.events;
DROP POLICY IF EXISTS "Admins Manage Events" ON public.events;
DROP POLICY IF EXISTS "Everyone can insert events" ON public.events; -- cleanup potential loose policies

-- 3. Policy: Public Read
CREATE POLICY "Public Read Events"
ON public.events
FOR SELECT
USING (true);

-- 4. Policy: Authenticated Users (Admins) Can Insert/Update/Delete
-- Note: Ideally we want strict admin check, but for now we rely on the helper or basic auth
-- Assuming the frontend checks for admin before showing the button, but backend should too.
-- Uses the robust 'admin_check_robust()' if available, or fallback to ANY authenticated user if acceptable for this stage.
-- We will use a safe approach: Allow if user is authenticated AND (is admin OR address matches strict admin list)

CREATE POLICY "Admins Manage Events"
ON public.events
FOR ALL
TO authenticated
USING (
  public.admin_check_robust() OR 
  (auth.jwt() ->> 'email') IN ('admin@drophunt.xyz', 'super@drophunt.xyz') -- fallback
  OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND (public.users.role = 'admin' OR public.users."memberStatus" = 'Admin')
  )
);

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;

-- Fix Sequence if needed (commonly causes insert errors)
-- Check if id is text or serial. Based on code: Date.now().toString() -> text/string.
-- No sequence fix needed for text IDs.
