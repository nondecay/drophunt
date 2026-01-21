-- DIAGNOSTIC QUERY
-- Please run this to show me the exact structure and active policies.

-- 1. Check Events Table Structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events';

-- 2. Check Active RLS Policies for Events
SELECT polname, polcmd, polroles, polqual, polwithcheck
FROM pg_policy
WHERE polrelid = 'public.events'::regclass;

-- 3. Check Current User Role/Claims (to see why Admin check fails)
-- Note: This will show null if run in SQL editor as 'postgres' role, 
-- but it helps if run in the context of the app user if possible (rarely applicable for SQL editor)
-- Instead, check the users table structure to match our assumption
SELECT * FROM public.users LIMIT 1;
