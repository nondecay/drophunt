/*
   REBUILD EVERYTHING FIX (The "Zero to Hero" Script)
   Purpose: 
   1. Unblock the App by resetting all security policies using DYNAMIC SQL (No name guessing).
   2. Ensure "userId" column formatting is correct (UUID/CamelCase).
   3. Grant clear permissions to Authenticated users.
   4. Re-apply strict policies for all tables.
*/

-- 1. GLOBAL PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. DYNAMIC POLICY DROPPER (Nuclear Option)
-- Drops every single policy on these tables, regardless of name.
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
    tables TEXT[] := ARRAY['users', 'todos', 'user_claims', 'inbox_messages', 'comments', 'airdrops'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Disable RLS first
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop all policies
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, tbl;
        END LOOP;
        
        -- Re-enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;


-- 3. SCHEMA NORMALIZATION
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


-- 4. RE-APPLY STRICT POLICIES

-- A. USERS (Public Read, Self Write)
CREATE POLICY "Users_Select_Public" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users_Update_Self" ON public.users FOR UPDATE USING (auth.uid() = id);

-- B. TODOS (Auth Insert, Owner Manage)
CREATE POLICY "Todos_Insert_Strict" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select_Owner" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Update_Owner" ON public.todos FOR UPDATE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Delete_Owner" ON public.todos FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- C. CLAIMS (Auth Insert, Owner Manage)
CREATE POLICY "Claims_Insert_Strict" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select_Owner" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Update_Owner" ON public.user_claims FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Claims_Delete_Owner" ON public.user_claims FOR DELETE USING (auth.uid() = "userId");

-- D. INBOX (Auth Insert, Owner Select)
CREATE POLICY "Inbox_Insert_Strict" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select_Owner" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");

-- E. COMMENTS (Public Read, Auth Insert, Owner Delete)
CREATE POLICY "Comments_Select_Public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Strict" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete_Owner" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- F. AIRDROPS (Public Read, Admin Write)
CREATE POLICY "Airdrops_Select_Public" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Airdrops_Write_Admin" ON public.airdrops FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
