-- SCHEMA & RLS HARMONIZATION FIX
-- Purpose: Ensure database columns match the application code ("userId") and RLS policies.
-- Fixes: "Column does not exist" or RLS failing due to column name/type mismatch.

-- 1. TODOS TABLE
-- Ensure column is named "userId" (CamelCase)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
    ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
  END IF;
END $$;

-- Ensure it is UUID
ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- Re-apply RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos_Select" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert" ON public.todos;
DROP POLICY IF EXISTS "Todos_Update" ON public.todos;
DROP POLICY IF EXISTS "Todos_Delete" ON public.todos;

CREATE POLICY "Todos_Insert" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Update" ON public.todos FOR UPDATE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Delete" ON public.todos FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. USER CLAIMS
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
    ALTER TABLE public.user_claims RENAME COLUMN user_id TO "userId";
  END IF;
END $$;

ALTER TABLE public.user_claims ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;

CREATE POLICY "Claims_Insert" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
-- Add Update/Delete as needed
CREATE POLICY "Claims_Update" ON public.user_claims FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Claims_Delete" ON public.user_claims FOR DELETE USING (auth.uid() = "userId");


-- 3. INBOX MESSAGES
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'user_id') THEN
    ALTER TABLE public.inbox_messages RENAME COLUMN user_id TO "userId";
  END IF;
END $$;

ALTER TABLE public.inbox_messages ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;

CREATE POLICY "Inbox_Insert" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 4. COMMENTS (Address based)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Select" ON public.comments;

CREATE POLICY "Comments_Insert" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Select" ON public.comments FOR SELECT USING (true);


-- 5. USERS (Final Check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users_Insert_Self" ON public.users;
CREATE POLICY "Users_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

