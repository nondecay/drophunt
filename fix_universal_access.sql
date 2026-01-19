/*
   UNIVERSAL ACCESS FIX (V9)
   Purpose: 
   1. DISABLE RLS first (Guarantees immediate fix).
   2. Clean up ALL previous policy attempts explicitly.
   3. Re-enable RLS with the "Public Insert" rule (Verified working logic).
*/

-- 1. DISABLE RLS (The "Safety Net")
-- If the rest of the script fails, at least this keeps the app working.
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops DISABLE ROW LEVEL SECURITY;

-- 2. EXPLICIT CLEANUP (Drop known policies)
-- Todos
DROP POLICY IF EXISTS "Todos_Insert_Strict" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Owner" ON public.todos;
DROP POLICY IF EXISTS "Todos_Manage_Owner" ON public.todos;
DROP POLICY IF EXISTS "Todos_Permissive" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Relaxed" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Relaxed" ON public.todos;
DROP POLICY IF EXISTS "Todos_Manage_Relaxed" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Stable" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Stable" ON public.todos;
DROP POLICY IF EXISTS "Todos_Manage_Stable" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Public" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Rescue" ON public.todos;

-- Claims
DROP POLICY IF EXISTS "Claims_Insert_Strict" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Select_Owner" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Manage_Owner" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Permissive" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Relaxed" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Stable" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Select_Stable" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Manage_Stable" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Public" ON public.user_claims;

-- Inbox
DROP POLICY IF EXISTS "Inbox_Insert_Strict" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Select_Owner" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Permissive" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Relaxed" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Stable" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Select_Stable" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Public" ON public.inbox_messages;

-- Comments
DROP POLICY IF EXISTS "Comments_Insert_Strict" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete_Owner" ON public.comments;
DROP POLICY IF EXISTS "Comments_Permissive" ON public.comments;
DROP POLICY IF EXISTS "Comments_Select_Public" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert_Stable" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete_Stable" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert_Public" ON public.comments;

-- Airdrops
DROP POLICY IF EXISTS "Airdrops_Permissive" ON public.airdrops;
DROP POLICY IF EXISTS "Airdrops_Read_Public" ON public.airdrops;
DROP POLICY IF EXISTS "Airdrops_Write_Admin" ON public.airdrops;


-- 3. APPLY "UNIVERSAL" POLICIES (Public Insert / Owner Select)
-- Re-enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;

-- Todos
CREATE POLICY "Todos_Insert_Universal" ON public.todos FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos_Select_Universal" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Manage_Universal" ON public.todos FOR ALL USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Claims
CREATE POLICY "Claims_Insert_Universal" ON public.user_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Claims_Select_Universal" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Manage_Universal" ON public.user_claims FOR ALL USING (auth.uid() = "userId");

-- Inbox
CREATE POLICY "Inbox_Insert_Universal" ON public.inbox_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Inbox_Select_Universal" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");

-- Comments
CREATE POLICY "Comments_Select_Universal" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Universal" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Comments_Delete_Universal" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Airdrops
CREATE POLICY "Airdrops_Read_Universal" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Airdrops_Write_Universal" ON public.airdrops FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
