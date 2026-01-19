/*
   FINAL SYSTEM REPAIR V4
   Purpose: 
   1. Clean up ALL RLS policies for Todos, Inbox, Claims, Comments, AND USERS.
   2. Ensure "userId" column formatting is correct.
   3. Grant clear permissions to Authenticated users.
   4. Resolve 403 Forbidden errors definitively.
*/

-- 1. GLOBAL PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. USERS TABLE (Critical for Subqueries)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can create their profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users_View_Public" ON public.users;
DROP POLICY IF EXISTS "Users_Insert_Self" ON public.users;
DROP POLICY IF EXISTS "Users_Update_Self" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- View: Public (Needed for 'admin' role checks in other policies)
CREATE POLICY "Users_View_Public" ON public.users FOR SELECT USING (true);
-- Insert/Update: Self Only
CREATE POLICY "Users_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users_Update_Self" ON public.users FOR UPDATE USING (auth.uid() = id);


-- 3. TODOS TABLE
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
-- Extensive Drop List
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
DROP POLICY IF EXISTS "Todos_Insert_Magic" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Magic" ON public.todos;
DROP POLICY IF EXISTS "Todos_Update_Magic" ON public.todos;
DROP POLICY IF EXISTS "Todos_Delete_Magic" ON public.todos;

-- Normalize Column
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
-- Insert: Authenticated (Strict)
CREATE POLICY "Todos_Insert_Final" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Select/Manage: Owner OR Admin
CREATE POLICY "Todos_Select_Final" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Update_Final" ON public.todos FOR UPDATE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Delete_Final" ON public.todos FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 4. INBOX MESSAGES
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users_View_Own_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Magic" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Select_Magic" ON public.inbox_messages;

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
CREATE POLICY "Inbox_Insert_Final" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select_Final" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 5. USER CLAIMS
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Update" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Delete" ON public.user_claims;
DROP POLICY IF EXISTS "Users_Manage_Own_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Magic" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Select_Magic" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Update_Magic" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Delete_Magic" ON public.user_claims;

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
CREATE POLICY "Claims_Insert_Final" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select_Final" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Update_Final" ON public.user_claims FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Claims_Delete_Final" ON public.user_claims FOR DELETE USING (auth.uid() = "userId");


-- 6. COMMENTS
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert_Magic" ON public.comments;
DROP POLICY IF EXISTS "Comments_Select_Magic" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete_Magic" ON public.comments;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments_Select_Final" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Final" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete_Final" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
