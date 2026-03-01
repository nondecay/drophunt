-- FINAL TRACKING FIX (FORCE)
-- 1. Ensures column exists (camelCase)
-- 2. Ensures Policy exists using simple AUTH check.

BEGIN;

-- 1. Ensure Column Exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trackedProjectIds') THEN
        ALTER TABLE public.users ADD COLUMN "trackedProjectIds" TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 2. Reset Update Policy (Brute Force)
DROP POLICY IF EXISTS "Users_Update_Optimized" ON public.users;
DROP POLICY IF EXISTS "Unified_Users_Update" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users_Update_Final" ON public.users 
FOR UPDATE USING (
    auth.uid() = id
    OR
    (select public.is_admin_check())
);

-- 3. Grant Permissions explicit (just in case)
GRANT UPDATE("trackedProjectIds") ON public.users TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
