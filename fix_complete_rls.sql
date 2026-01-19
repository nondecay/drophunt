-- COMPLETE SYSTEM RLS REPAIR
-- Purpose: Strict Security + Functional Persistence for ALL Tables.
-- Logic: 
-- 1. INSERT: Allowed for 'authenticated' role.
-- 2. SELECT/UPDATE/DELETE: Allowed for Owner (auth.uid() = id/userId).
-- 3. ADMIN: Full Access.

-- O. USERS TABLE (My Airdrops / Profile)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users_Update_Self" ON public.users;
DROP POLICY IF EXISTS "Strict_Update_Self" ON public.users;
DROP POLICY IF EXISTS "Strict_Insert_Self" ON public.users;
DROP POLICY IF EXISTS "Strict_View_Users" ON public.users;

-- View: Public
CREATE POLICY "Users_View_Public" ON public.users FOR SELECT USING (true);
-- Update: Self Only (Matches ID)
CREATE POLICY "Users_Update_Self" ON public.users FOR UPDATE USING (auth.uid() = id);
-- Insert: Self Only
CREATE POLICY "Users_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);


-- 1. TODOS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos_Select" ON public.todos;
DROP POLICY IF EXISTS "Todos_Insert" ON public.todos;
DROP POLICY IF EXISTS "Todos_Update" ON public.todos;
DROP POLICY IF EXISTS "Todos_Delete" ON public.todos;

CREATE POLICY "Todos_Select" ON public.todos FOR SELECT USING (auth.uid()::text = "userId"::text OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Insert" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Todos_Update" ON public.todos FOR UPDATE USING (auth.uid()::text = "userId"::text OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Todos_Delete" ON public.todos FOR DELETE USING (auth.uid()::text = "userId"::text OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 2. USER CLAIMS
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Insert" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Update" ON public.user_claims;
DROP POLICY IF EXISTS "Claims_Delete" ON public.user_claims;

CREATE POLICY "Claims_Select" ON public.user_claims FOR SELECT USING (auth.uid()::text = "userId"::text);
CREATE POLICY "Claims_Insert" ON public.user_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Claims_Update" ON public.user_claims FOR UPDATE USING (auth.uid()::text = "userId"::text);
CREATE POLICY "Claims_Delete" ON public.user_claims FOR DELETE USING (auth.uid()::text = "userId"::text);


-- 3. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Comments_Delete" ON public.comments;

CREATE POLICY "Comments_Select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments_Insert" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comments_Delete" ON public.comments FOR DELETE USING (
    address = (SELECT address FROM public.users WHERE id = auth.uid()) 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


-- 4. INBOX
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Inbox_Insert" ON public.inbox_messages;

CREATE POLICY "Inbox_Select" ON public.inbox_messages FOR SELECT USING (auth.uid()::text = "userId"::text);
-- Only Admin or System usually sends messages, but allowing Auth for now if you have user-to-user logic
CREATE POLICY "Inbox_Insert" ON public.inbox_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 5. GUIDES
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guides_Select" ON public.guides;
DROP POLICY IF EXISTS "Guides_Insert" ON public.guides;
DROP POLICY IF EXISTS "Guides_Manage" ON public.guides;

CREATE POLICY "Guides_Select" ON public.guides FOR SELECT USING (true);
CREATE POLICY "Guides_Insert" ON public.guides FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Guides_Manage" ON public.guides FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 6. AIRDROP REQUESTS
ALTER TABLE public.airdrop_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Requests_Select" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Requests_Insert" ON public.airdrop_requests;

CREATE POLICY "Requests_Select" ON public.airdrop_requests FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Requests_Insert" ON public.airdrop_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
