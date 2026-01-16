-- STRICT SECURITY MODE (ENABLE AFTER SIWE DEPLOYMENT)
-- This script reverts the "Permissive" policies and enabling strict "Authenticated Only" RLS.
-- Run this ONLY after confirming that "Verify Wallet" successfully logs the user into Supabase.

-- 1. USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_View_Users" ON public.users;
DROP POLICY IF EXISTS "Public_Insert_Users" ON public.users;
DROP POLICY IF EXISTS "Public_Update_Users" ON public.users;

-- Strict Policies
CREATE POLICY "Strict_View_Users" ON public.users FOR SELECT USING (true); -- Public profiles are visible
CREATE POLICY "Strict_Update_Self" ON public.users FOR UPDATE USING (auth.uid() = id);
-- Insert is handled by Edge Function or Admin, regular users don't insert directly often, 
-- but if they do (auto-reg flow):
CREATE POLICY "Strict_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. TODOS (Tasks)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_All_Todos" ON public.todos;

CREATE POLICY "Strict_Select_Todos" ON public.todos FOR SELECT USING (true);
CREATE POLICY "Strict_Insert_Todos" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Only owner or admin can update/delete
CREATE POLICY "Strict_Update_Todos" ON public.todos FOR UPDATE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Strict_Delete_Todos" ON public.todos FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 3. USER CLAIMS
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_All_Claims" ON public.user_claims;

CREATE POLICY "Strict_Select_Claims" ON public.user_claims FOR SELECT USING (true);
CREATE POLICY "Strict_Insert_Claims" ON public.user_claims FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Strict_Update_Claims" ON public.user_claims FOR UPDATE USING (auth.uid() = "userId"); 


-- 4. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_All_Comments" ON public.comments;

CREATE POLICY "Strict_Select_Comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Strict_Insert_Comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Strict_Delete_Comments" ON public.comments FOR DELETE USING (auth.uid() = "userId" OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 5. ADMIN TABLES (Airdrops, etc)
-- Revert "Public_Manage_..." policies
DROP POLICY IF EXISTS "Public_Manage_Airdrops" ON public.airdrops;
CREATE POLICY "Strict_Manage_Airdrops" ON public.airdrops FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Public_View_Airdrops" ON public.airdrops FOR SELECT USING (true);

-- Repeat for other admin tables if needed, but this is the core pattern.
-- For now, we can leave other admin tables permissive OR lock them down. 
-- Let's lock down the sensitive ones.

DROP POLICY IF EXISTS "Public_Manage_Investors" ON public.investors;
CREATE POLICY "Strict_Manage_Investors" ON public.investors FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Public_View_Investors" ON public.investors FOR SELECT USING (true);
