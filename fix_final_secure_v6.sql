/*
   FINAL SECURE FIX (V6) - "Back to Safety"
   Purpose:
   1. The App is working (Frontend sends "userId", DB has "userId").
   2. Now we remove the "Permissive/Allow-All" temporary policies.
   3. We apply the STRICT Security Rules again.
   
   WHY IT WILL WORK NOW:
   - We fixed the Frontend Query (AppContext.tsx) to match the DB Column ("userId").
   - We fixed the Session Persistence (supabaseClient.ts) so "Authenticated" check passes.
*/

-- 1. TODOS: LOCK DOWN
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Clean Permissive Policies
DROP POLICY IF EXISTS "Todos_Permissive" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Relaxed" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Relaxed" ON public.todos;
DROP POLICY IF EXISTS "Todos_Manage_Relaxed" ON public.todos;

-- Apply Strict Policies
CREATE POLICY "Todos_Insert_Strict" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select_Owner" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Manage_Owner" ON public.todos FOR ALL USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. CLAIMS: LOCK DOWN
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Claims_Permissive" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Relaxed" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Select_Relaxed" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Manage_Relaxed" ON public.user_claims;

CREATE POLICY "Claims_Insert_Strict" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select_Owner" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Manage_Owner" ON public.user_claims FOR ALL USING (auth.uid() = "userId");


-- 3. INBOX: LOCK DOWN
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inbox_Permissive" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Relaxed" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Select_Relaxed" ON public.inbox_messages;

CREATE POLICY "Inbox_Insert_Strict" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select_Owner" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 4. COMMENTS: LOCK DOWN
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments_Permissive" ON public.comments;
DROP POLICY IF EXISTS "Comments_Select_Relaxed" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert_Relaxed" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete_Relaxed" ON public.comments;

CREATE POLICY "Comments_Select_Public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Strict" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete_Owner" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
