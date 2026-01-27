-- DIAGNOSE PERSISTENCE
-- Check guides column and is_admin_check function

-- 1. Check Guides Columns
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'guides';

-- 2. Test Admin Check Logic (Simulated)
-- We can't run auth.uid() directly here as it will be null/anon
-- But we can check if the function exists and is valid
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'is_admin_check';

-- 3. Check Users Policies (Is RLS blocking the check?)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

-- 4. Check Comments Policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'comments';
