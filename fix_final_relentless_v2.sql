-- FINAL RELENTLESS FIX V2
-- Purpose: Fix "cannot alter type of a column used in a policy" error.
-- Update: Added missing policy "Users_View_Own_Inbox" and others to DROP list.

-- 1. TODOS TABLE
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;

-- ACCUMULATED DROP LIST (All possible names)
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
DROP POLICY IF EXISTS "Todos_Select_Owner" ON public.todos;
DROP POLICY IF EXISTS "Todos_Update_Owner" ON public.todos;
DROP POLICY IF EXISTS "Todos_Delete_Owner" ON public.todos;
DROP POLICY IF EXISTS "Users_View_Own_Todos" ON public.todos;
DROP POLICY IF EXISTS "Users_Manage_Own_Todos" ON public.todos;

-- ALTER COLUMN
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;

ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- RE-APPLY POLICIES
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos_Insert" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Update" ON public.todos FOR UPDATE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Delete" ON public.todos FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. INBOX MESSAGES (The source of the specific error)
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;

-- EXTENSIVE DROP LIST
DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Insert_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Select_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users_View_Own_Inbox" ON public.inbox_messages; -- <--- The culprit
DROP POLICY IF EXISTS "Users_View_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Manage_Own" ON public.inbox_messages;

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'userId') THEN
          ALTER TABLE public.inbox_messages RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;

ALTER TABLE public.inbox_messages ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inbox_Insert" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 3. USER CLAIMS
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Update" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Delete" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Update_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Select_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Insert_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Delete_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users_View_Own_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users_Manage_Own_Claims" ON public.user_claims;

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'userId') THEN
          ALTER TABLE public.user_claims RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;

ALTER TABLE public.user_claims ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims_Insert" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Update" ON public.user_claims FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Claims_Delete" ON public.user_claims FOR DELETE USING (auth.uid() = "userId");


-- 4. COMMENTS
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete" ON public.comments;
DROP POLICY IF EXISTS "Strict_Insert_Comments" ON public.comments;
DROP POLICY IF EXISTS "Comments_Are_Public" ON public.comments;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments_Select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
