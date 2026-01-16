-- FINAL PERMISSIVE FIX
-- This script removes all barriers to entry for key tables.
-- It sets RLS policies to "Allow All" for the Public role.
-- This is necessary because the app seems to use client-side auth verification 
-- that doesn't always translate to a Supabase 'authenticated' session.

-- 1. USERS (Registration & Updates)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Users_Select" ON public.users;
DROP POLICY IF EXISTS "Repair_Users_Update" ON public.users;
DROP POLICY IF EXISTS "Public_View_Users" ON public.users;
DROP POLICY IF EXISTS "Users_Update_Self_Broad" ON public.users;

-- Allow ANYONE to select (needed for profiles)
CREATE POLICY "Public_Select_Users" ON public.users FOR SELECT USING (true);
-- Allow ANYONE to insert (needed for registration)
CREATE POLICY "Public_Insert_Users" ON public.users FOR INSERT WITH CHECK (true);
-- Allow ANYONE to update (needed for profile changes, trusting client verification)
CREATE POLICY "Public_Update_Users" ON public.users FOR UPDATE USING (true);


-- 2. TODOS (Tasks)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Todos_Select" ON public.todos;
DROP POLICY IF EXISTS "Repair_Todos_All" ON public.todos;
-- ... drop others if needed ...

CREATE POLICY "Public_All_Todos" ON public.todos FOR ALL USING (true) WITH CHECK (true);


-- 3. USER CLAIMS (My Airdrops)
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Claims_Select" ON public.user_claims;
DROP POLICY IF EXISTS "Repair_Claims_All" ON public.user_claims;

CREATE POLICY "Public_All_Claims" ON public.user_claims FOR ALL USING (true) WITH CHECK (true);


-- 4. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Comments_Select" ON public.comments;
DROP POLICY IF EXISTS "Repair_Comments_Insert" ON public.comments;
DROP POLICY IF EXISTS "Repair_Comments_Delete" ON public.comments;

CREATE POLICY "Public_All_Comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);


-- 5. GUIDES
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Guides_Select" ON public.guides;
DROP POLICY IF EXISTS "Repair_Guides_All" ON public.guides;

CREATE POLICY "Public_All_Guides" ON public.guides FOR ALL USING (true) WITH CHECK (true);


-- 6. MESSAGES (Admin Broadcasts)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Messages_Select" ON public.messages;
DROP POLICY IF EXISTS "Repair_Messages_All" ON public.messages;

CREATE POLICY "Public_All_Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);


-- 7. EVENTS (Calendar)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Events_Select" ON public.events;
DROP POLICY IF EXISTS "Repair_Events_All" ON public.events;

CREATE POLICY "Public_All_Events" ON public.events FOR ALL USING (true) WITH CHECK (true);


-- 8. INBOX MESSAGES
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Repair_Inbox_Insert" ON public.inbox_messages;

CREATE POLICY "Public_All_Inbox" ON public.inbox_messages FOR ALL USING (true) WITH CHECK (true);


-- 9. CALENDAR EVENTS (Legacy)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Repair_Calendar_Select" ON public.calendar_events;
DROP POLICY IF EXISTS "Repair_Calendar_All" ON public.calendar_events;

CREATE POLICY "Public_All_Legacy_Calendar" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);
