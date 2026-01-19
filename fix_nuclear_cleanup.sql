/*
   NUCLEAR CLEANUP & RESTORE (The "Dynamic Drop" Script)
   Purpose:
   1. Dynamically finds and DROPS ALL policies on target tables (No guessing names).
   2. Clears the way for aggressive Schema fixes.
   3. Re-applies clean, strict RLS policies.
*/

-- 1. DYNAMIC POLICY DROPPER (The Magic Fix)
-- This block will find every single policy on 'todos' and delete it.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'todos' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.todos', pol.policyname);
    END LOOP;
END $$;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_claims' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_claims', pol.policyname);
    END LOOP;
END $$;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'inbox_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inbox_messages', pol.policyname);
    END LOOP;
END $$;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'comments' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.comments', pol.policyname);
    END LOOP;
END $$;


-- 2. SCHEMA NORMALIZATION (Now safe to run)
-- Todos
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;
ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- Claims
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'userId') THEN
          ALTER TABLE public.user_claims RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;
ALTER TABLE public.user_claims ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- Inbox
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'userId') THEN
          ALTER TABLE public.inbox_messages RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;
ALTER TABLE public.inbox_messages ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;


-- 3. PERMISSIONS GRANT
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- 4. APPLY CLEAN RLS
-- Todos
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos_Insert_Nuclear" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select_Nuclear" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Manage_Nuclear" ON public.todos FOR ALL USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Claims
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims_Insert_Nuclear" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select_Nuclear" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Manage_Nuclear" ON public.user_claims FOR ALL USING (auth.uid() = "userId");

-- Inbox
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inbox_Insert_Nuclear" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select_Nuclear" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments_Select_Nuclear" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Nuclear" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete_Nuclear" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
