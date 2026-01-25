-- NUCLEAR RESET (HARDCODED ADMIN)
-- This script wipes EVERY policy on 'events' regardless of name.
-- Then re-applies ONLY the hardcoded ID check.

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'events' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- SINGLE WRITE POLICY (Hardcoded ID)
CREATE POLICY "Strict_Admin_Insert_Only"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid()::text = '59d84d29-56cb-4db9-87cf-52b483766518'
);

CREATE POLICY "Strict_Admin_Mod_Only"
ON public.events
FOR ALL
TO authenticated
USING (
    auth.uid()::text = '59d84d29-56cb-4db9-87cf-52b483766518'
);

-- PUBLIC READ
CREATE POLICY "Public_Read_All"
ON public.events
FOR SELECT
USING (true);
