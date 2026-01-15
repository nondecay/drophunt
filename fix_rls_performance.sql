-- Fix for: RLS policies re-evaluating auth.uid() or auth.role() for each row
-- Performance Best Practice: Wrap auth calls in (select ...) to force single execution per query

-- 1. USERS
DROP POLICY IF EXISTS "Users can create their profile" ON public.users;
CREATE POLICY "Users can create their profile" ON public.users FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can update everything" ON public.users;
CREATE POLICY "Admins can update everything" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- 2. ADMIN SECRETS
DROP POLICY IF EXISTS "Admins can view their own secrets" ON public.admin_secrets;
CREATE POLICY "Admins can view their own secrets" ON public.admin_secrets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage secrets" ON public.admin_secrets;
CREATE POLICY "Admins can manage secrets" ON public.admin_secrets FOR ALL USING ((select auth.uid()) = user_id);

-- 3. COMMENTS
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- 4. GUIDES
DROP POLICY IF EXISTS "Users can submit guides" ON public.guides;
CREATE POLICY "Users can submit guides" ON public.guides FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- 5. INBOX MESSAGES
DROP POLICY IF EXISTS "Users can view their inbox" ON public.inbox_messages;
CREATE POLICY "Users can view their inbox" ON public.inbox_messages FOR SELECT USING ((select auth.uid()) = "userId");

-- 6. TODOS
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos" ON public.todos USING ((select auth.uid()) = "userId");

-- 7. USER CLAIMS
DROP POLICY IF EXISTS "Users can manage their own claims" ON public.user_claims;
CREATE POLICY "Users can manage their own claims" ON public.user_claims USING ((select auth.uid()) = "userId");
