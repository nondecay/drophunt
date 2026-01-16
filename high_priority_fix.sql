-- HIGH PRIORITY RLS FIX
-- Run this in Supabase SQL Editor immediately to restore functionality.

-- 1. TODOS (Fix "add task")
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;

CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT USING ((select auth.uid()) = "userId");
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT WITH CHECK ((select auth.uid()) = "userId");
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING ((select auth.uid()) = "userId");
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING ((select auth.uid()) = "userId");

-- 2. USER CLAIMS (Fix "add claim")
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users can view own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users can insert own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users can update own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users can delete own claims" ON public.user_claims;

CREATE POLICY "Users can view own claims" ON public.user_claims FOR SELECT USING ((select auth.uid()) = "userId");
CREATE POLICY "Users can insert own claims" ON public.user_claims FOR INSERT WITH CHECK ((select auth.uid()) = "userId");
CREATE POLICY "Users can update own claims" ON public.user_claims FOR UPDATE USING ((select auth.uid()) = "userId");
CREATE POLICY "Users can delete own claims" ON public.user_claims FOR DELETE USING ((select auth.uid()) = "userId");

-- 3. USERS (Fix "Track Project")
-- Allow users to update their own profile (includes trackedProjectIds)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((select auth.uid()) = id);

-- 4. MESSAGES (Fix Admin Broadcasts)
-- Addressing 'messages' table specifically as requested by error logs
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    content TEXT,
    type TEXT,
    "createdAt" BIGINT,
    "targetRole" TEXT,
    "authorId" UUID,
    "relatedAirdropId" TEXT,
    "projectId" TEXT
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.messages;
DROP POLICY IF EXISTS "Public view messages" ON public.messages;

CREATE POLICY "Public view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Admins can manage messages" ON public.messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- 5. EVENTS (Fix Calendar)
-- Addressing 'events' table specifically as requested by error logs
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    date TEXT,
    type TEXT,
    description TEXT,
    url TEXT
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Public view events" ON public.events;

CREATE POLICY "Public view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- 6. COMMENTS (Fix User Comments)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- 7. GUIDES (Fix User Guides)
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can submit guides" ON public.guides;
CREATE POLICY "Users can submit guides" ON public.guides FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- 8. Enable Legacy/Alternate Tables just in case
-- Calendar Events (Alternative name)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
create policy "Admins can manage calendar_events" on public.calendar_events for all using (
  exists (select 1 from public.users where id = (select auth.uid()) and role = 'admin')
);
create policy "Public view calendar_events" on public.calendar_events for select using (true);

-- Inbox Messages (Alternative name)
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
create policy "Admins can manage inbox_messages" on public.inbox_messages for all using (
  exists (select 1 from public.users where id = (select auth.uid()) and role = 'admin')
);
create policy "Users view own inbox" on public.inbox_messages for select using (
  (select auth.uid()) = "userId"
);
