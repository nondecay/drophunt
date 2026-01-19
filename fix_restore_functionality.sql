/*
   RESTORE FUNCTIONALITY FIX (V5)
   Purpose:
   1. Unblock the App by resetting all security policies.
   2. Ensure "Authenticated User" release valve is open for Inserts.
   3. Fix column names ("userId") once and for all.
   4. Clear any "Ghost" policies preventing the fix.
*/

-- 0. GRANT ESSENTIAL PERMISSIONS
-- This ensures the "Permission Denied" (403) is not due to Table Access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 1. TODOS TABLE FIX
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;

-- NUCLEAR POLICY CLEANUP (Drop Everything)
DROP POLICY IF EXISTS "Todos_Select" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert" ON public.todos;
DROP POLICY IF EXISTS "Todos_Update" ON public.todos;
DROP POLICY IF EXISTS "Todos_Delete" ON public.todos;
DROP POLICY IF EXISTS "Strict_Update_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Select_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Delete_Todos" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Auth" ON public.todos;
DROP POLICY IF EXISTS "Allow_Auth_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Emergency_Allow_All_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Magic" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Magic" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Final" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Final" ON public.todos;

-- FIX COLUMNS (Graceful Rename)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;
ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID;

-- APPLY FUNCTIONAL SECURITY
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
-- Insert: ANY Authenticated User (Required for the App to work)
CREATE POLICY "Todos_Insert_V5" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Select: Owner Only
CREATE POLICY "Todos_Select_V5" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
-- Manage: Owner Only
CREATE POLICY "Todos_Manage_V5" ON public.todos FOR ALL USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. USER CLAIMS FIX
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Update" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Delete" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Magic" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Final" ON public.user_claims;

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
CREATE POLICY "Claims_Insert_V5" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select_V5" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Manage_V5" ON public.user_claims FOR ALL USING (auth.uid() = "userId");


-- 3. INBOX FIX
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Insert_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Magic" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Final" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users_View_Own_Inbox" ON public.inbox_messages;

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
CREATE POLICY "Inbox_Insert_V5" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select_V5" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 4. COMMENTS FIX
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert_Final" ON public.comments;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments_Select_V5" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_V5" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete_V5" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
