/*
   REACTIVATE SECURITY (The Final Lock)
   Purpose:
   1. The app works now because RLS is likely OFF or Permissive.
   2. Logic: The Frontend IS sending "userId" correctly. The DB HAS "userId".
   3. Action: Turn RLS back ON and apply the Strict Policies verified to match "userId".
*/

-- 1. TODOS: SECURE
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Clean old policies just in case
DROP POLICY IF EXISTS "Todos_Select" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert" ON public.todos;
DROP POLICY IF EXISTS "Todos_Manage" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert_Nuclear" ON public.todos;
DROP POLICY IF EXISTS "Todos_Select_Nuclear" ON public.todos;
DROP POLICY IF EXISTS "Todos_Manage_Nuclear" ON public.todos;

-- Apply Strict Policies (Matches "userId" column)
CREATE POLICY "Todos_Insert_Secure" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Select_Secure" ON public.todos FOR SELECT USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Manage_Secure" ON public.todos FOR ALL USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. CLAIMS: SECURE
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Manage" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert_Nuclear" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Select_Nuclear" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Manage_Nuclear" ON public.user_claims;

CREATE POLICY "Claims_Insert_Secure" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Select_Secure" ON public.user_claims FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Claims_Manage_Secure" ON public.user_claims FOR ALL USING (auth.uid() = "userId");


-- 3. INBOX: SECURE
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert_Nuclear" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Select_Nuclear" ON public.inbox_messages;

CREATE POLICY "Inbox_Insert_Secure" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inbox_Select_Secure" ON public.inbox_messages FOR SELECT USING (auth.uid() = "userId");


-- 4. COMMENTS: SECURE
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete" ON public.comments;
DROP POLICY IF EXISTS "Comments_Select_Nuclear" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert_Nuclear" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete_Nuclear" ON public.comments;

CREATE POLICY "Comments_Select_Secure" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert_Secure" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete_Secure" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 5. AIRDROPS: SECURE
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Airdrops_Select_Public" ON public.airdrops;
DROP POLICY IF EXISTS "Airdrops_Write_Admin" ON public.airdrops;

CREATE POLICY "Airdrops_Select_Secure" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Airdrops_Write_Secure" ON public.airdrops FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 6. ACTIVITIES: SECURE
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities_Select_Public" ON public.activities;
DROP POLICY IF EXISTS "Activities_Write_Admin" ON public.activities;

CREATE POLICY "Activities_Select_Secure" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Activities_Write_Secure" ON public.activities FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
