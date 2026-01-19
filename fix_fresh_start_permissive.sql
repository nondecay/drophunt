/*
   FRESH START: PERMISSIVE MODE (Zero to Hero - Unblocked)
   Purpose: 
   1. WIPE CLEAN all existing security policies (Nuclear).
   2. FIX standard column names ("userId") to match the App.
   3. OPEN GATES: Allow Everyone to Read/Write everything (temporarily).
   
   WHY? 
   To prove the system works. Once you confirm "It works!", we will lock it down one by one.
*/

-- 1. GLOBAL PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 2. DYNAMIC POLICY DROPPER (Nuclear Option)
-- Removes EVERY policy to ensure no conflicting "Strict" rules remain.
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
    tables TEXT[] := ARRAY['users', 'todos', 'user_claims', 'inbox_messages', 'comments', 'airdrops', 'activities'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Disable RLS first
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop all policies
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
        END LOOP;
        
        -- Re-enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;


-- 3. SCHEMA NORMALIZATION (Ensure "userId" exists)
-- Todos
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
  -- Ensure UUID type
  EXECUTE 'ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID';
END $$;

-- Claims
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'userId') THEN
          ALTER TABLE public.user_claims RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
  EXECUTE 'ALTER TABLE public.user_claims ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID';
END $$;

-- Inbox
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'userId') THEN
          ALTER TABLE public.inbox_messages RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
  EXECUTE 'ALTER TABLE public.inbox_messages ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID';
END $$;


-- 4. APPLY PERMISSIVE POLICIES (Allow All)

-- A. USERS 
CREATE POLICY "Users_Permissive" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- B. TODOS
CREATE POLICY "Todos_Permissive" ON public.todos FOR ALL USING (true) WITH CHECK (true);

-- C. CLAIMS
CREATE POLICY "Claims_Permissive" ON public.user_claims FOR ALL USING (true) WITH CHECK (true);

-- D. INBOX
CREATE POLICY "Inbox_Permissive" ON public.inbox_messages FOR ALL USING (true) WITH CHECK (true);

-- E. COMMENTS
CREATE POLICY "Comments_Permissive" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- F. AIRDROPS & ACTIVITIES
CREATE POLICY "Airdrops_Permissive" ON public.airdrops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Activities_Permissive" ON public.activities FOR ALL USING (true) WITH CHECK (true);
