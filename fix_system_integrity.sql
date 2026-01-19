/*
   SYSTEM INTEGRITY FIX v3 (The "Works on My Machine" Fix)
   Purpose: Resolve 403 Forbidden by handling RLS, Grants, and Schema.
   1. GRANTS permissions explicitly.
   2. CLEANS UP orphan policies.
   3. NORMALIZES columns.
   4. APPLIES strict RLS.
*/

-- A. GRANT PERMISSIONS (Often overlooked)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 1. TODOS FIX
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;

-- EXTENDED DROP LIST
DROP POLICY IF EXISTS "Todos_Select" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert" ON public.todos;
DROP POLICY IF EXISTS "Todos_Update" ON public.todos;
DROP POLICY IF EXISTS "Todos_Delete" ON public.todos;
DROP POLICY IF EXISTS "Strict_Update_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Select_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Delete_Todos" ON public.todos;
DROP POLICY IF EXISTS "Public_All_Todos" ON public.todos;
DROP POLICY IF EXISTS "Allow_Auth_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Auth" ON public.todos;
DROP POLICY IF EXISTS "Users_View_Own_Todos" ON public.todos;

-- NORMALIZE COLUMN (userId)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;

ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos_Insert" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Update" ON public.todos FOR UPDATE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Delete" ON public.todos FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. INBOX FIX
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Insert_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Select_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users_View_Own_Inbox" ON public.inbox_messages;

-- NORMALIZE
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'userId') THEN
          ALTER TABLE public.inbox_messages RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;

ALTER TABLE public.inbox_messages ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- RLS
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inbox_Insert" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 3. CLAIMS FIX
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Update" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Delete" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Delete_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users_Manage_Own_Claims" ON public.user_claims;

-- NORMALIZE
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'userId') THEN
          ALTER TABLE public.user_claims RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;

ALTER TABLE public.user_claims ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- RLS
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims_Insert" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Update" ON public.user_claims FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Claims_Delete" ON public.user_claims FOR DELETE USING (auth.uid() = "userId");


-- 4. COMMENTS FIX
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete" ON public.comments;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments_Select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
