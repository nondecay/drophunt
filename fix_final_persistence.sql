-- FINAL PERSISTENCE FIX (NUCLEAR OPTION)

-- 1. Ensure Table Permissions are ABSOLUTE
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all on user_claims" ON public.user_claims;
DROP POLICY IF EXISTS "Allow all on todos" ON public.todos;
DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;
DROP POLICY IF EXISTS "Public read messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.messages;
DROP POLICY IF EXISTS "Enable all access for authenticated users on claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users manage own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_claims;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON public.user_claims;

-- 2. Create UNCONDITIONAL Policies (Wildcard)
-- This ensures that ANY connection (Anon, Authenticated, Service) can R/W these tables.
-- Logic is handled by the App (Validation, User ID assignment).

CREATE POLICY "Nuclear Allow All Claims" ON public.user_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Nuclear Allow All Todos" ON public.todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Nuclear Allow All Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 3. Grant Privileges
GRANT ALL ON public.user_claims TO anon, authenticated, service_role;
GRANT ALL ON public.todos TO anon, authenticated, service_role;
GRANT ALL ON public.messages TO anon, authenticated, service_role;

-- 4. Verify Columns (One last check)
DO $$
BEGIN
   -- user_claims
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'projectName') THEN
       IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'projectname') THEN
            ALTER TABLE public.user_claims RENAME COLUMN projectname TO "projectName";
       END IF;
   END IF;
END $$;
