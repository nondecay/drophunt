-- FIX PERSISTENCE - RLS Column Mismatches
-- This script fixes RLS policies where "user_id" was used instead of "userId".
-- It targets: todos, user_claims, inbox_messages

-- 1. USER CLAIMS (Targeting "userId")
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Select_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Insert_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Update_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Delete_Claims" ON public.user_claims;

-- Ensure we match the "userId" column (quoted for case sensitivity)
CREATE POLICY "Strict_Select_Claims" ON public.user_claims FOR SELECT USING (true);

-- Insert: Frontend sends "userId", so we must allow insertion where "userId" = auth.uid()
CREATE POLICY "Strict_Insert_Claims" ON public.user_claims FOR INSERT WITH CHECK (
  auth.uid()::text = "userId"::text
);

CREATE POLICY "Strict_Update_Claims" ON public.user_claims FOR UPDATE USING (
  auth.uid()::text = "userId"::text
);

CREATE POLICY "Strict_Delete_Claims" ON public.user_claims FOR DELETE USING (
  auth.uid()::text = "userId"::text
);

-- 2. TODOS (Targeting "userId")
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Select_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Update_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Delete_Todos" ON public.todos;

CREATE POLICY "Strict_Select_Todos" ON public.todos FOR SELECT USING (true);

CREATE POLICY "Strict_Insert_Todos" ON public.todos FOR INSERT WITH CHECK (
  auth.uid()::text = "userId"::text
);

CREATE POLICY "Strict_Update_Todos" ON public.todos FOR UPDATE USING (
  auth.uid()::text = "userId"::text 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Strict_Delete_Todos" ON public.todos FOR DELETE USING (
  auth.uid()::text = "userId"::text 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 3. INBOX (Targeting "userId")
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Select_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Insert_Inbox" ON public.inbox_messages;

CREATE POLICY "Strict_Select_Inbox" ON public.inbox_messages FOR SELECT USING (
  auth.uid()::text = "userId"::text
);

-- Admins send messages
CREATE POLICY "Strict_Insert_Inbox" ON public.inbox_messages FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
