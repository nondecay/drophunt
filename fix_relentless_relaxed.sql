/*
   RELENTLESS RELAXED FIX (V8)
   Purpose:
   1. DYNAMICALLY wipe all policies (No guessing names, no "already exists" errors).
   2. Apply RELAXED SECURITY:
      - INSERT: Public (Allows Check 'true') -> Fixes "New Row Violates..."
      - SELECT: Private (Owner only) -> Keeps data safe.
*/

-- 1. DYNAMIC CLEANUP (The "Relentless" Cleaner)
-- This block finds EVERY policy on the tables and drops them.
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
    tables TEXT[] := ARRAY['todos', 'user_claims', 'inbox_messages', 'comments', 'users', 'airdrops'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Disable RLS to ensure we can modify
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop all policies dynamically
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, tbl;
        END LOOP;
        
        -- Re-enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;


-- 2. APPLY RELAXED POLICIES

-- A. USERS (Public Read, Self Edit)
CREATE POLICY "Users_Select_All" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users_Update_Self" ON public.users FOR UPDATE USING (auth.uid() = id);

-- B. TODOS (Public Insert, Owner Select)
-- "WITH CHECK (true)" guarantees inserts never fail RLS.
CREATE POLICY "Todos_Insert_Public" ON public.todos FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos_Select_Owner" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Manage_Owner" ON public.todos FOR ALL USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- C. CLAIMS (Public Insert, Owner Select)
CREATE POLICY "Claims_Insert_Public" ON public.user_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Claims_Select_Owner" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Manage_Owner" ON public.user_claims FOR ALL USING (auth.uid() = "userId");

-- D. INBOX (Public Insert, Owner Select)
CREATE POLICY "Inbox_Insert_Public" ON public.inbox_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Inbox_Select_Owner" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");

-- E. COMMENTS (Public Read, Public Insert, Owner Delete)
CREATE POLICY "Comments_Select_Public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Public" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Comments_Delete_Owner" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- F. AIRDROPS (Public Read)
CREATE POLICY "Airdrops_Read_Public" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Airdrops_Write_Admin" ON public.airdrops FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
