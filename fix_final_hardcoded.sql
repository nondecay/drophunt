-- FIX: HARDCODED ADMIN ID (STRICT)
-- User ID: 59d84d29-56cb-4db9-87cf-52b483766518 (Confirmed via Debug)
-- This grants access ONLY to this specific ID. No table lookups. No complexity.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Wipe previous policies
DROP POLICY IF EXISTS "Admins_Insert_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Insert_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Final" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Final" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Final" ON public.events;
DROP POLICY IF EXISTS "Public_Read_Perf" ON public.events;
DROP POLICY IF EXISTS "Admins_Insert_Perf" ON public.events;

-- READ: Everyone
CREATE POLICY "Public_Read_Absolute"
ON public.events 
FOR SELECT 
USING (true);

-- WRITE: Hardcoded Admin Only
-- Using ::text casting to be absolutely safe against UUID mismatch
CREATE POLICY "SuperAdmin_Insert"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid()::text = '59d84d29-56cb-4db9-87cf-52b483766518'
);

CREATE POLICY "SuperAdmin_Update"
ON public.events
FOR UPDATE
TO authenticated
USING ( auth.uid()::text = '59d84d29-56cb-4db9-87cf-52b483766518' )
WITH CHECK ( auth.uid()::text = '59d84d29-56cb-4db9-87cf-52b483766518' );

CREATE POLICY "SuperAdmin_Delete"
ON public.events
FOR DELETE
TO authenticated
USING ( auth.uid()::text = '59d84d29-56cb-4db9-87cf-52b483766518' );
