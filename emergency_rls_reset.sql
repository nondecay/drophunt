-- EMERGENCY RLS RESET & RESTORE
-- This script performs a "Hard Reset" on RLS policies for critical tables.
-- It uses a PL/pgSQL block to strictly DROP ALL policies first, ensuring no conflicting "False" policies remain.
-- Then it re-applies policies allowing authenticated users to function.

DO $$ 
DECLARE 
    tables TEXT[] := ARRAY['todos', 'user_claims', 'comments', 'guides', 'messages', 'inbox_messages', 'events', 'calendar_events', 'airdrop_requests', 'users'];
    t TEXT;
    p RECORD;
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Enable RLS just in case
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- Drop ALL existing policies for this table
            FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- NOW RE-CREATE POLICIES (Clean Slate)

-- 1. TODOS (User Access)
CREATE POLICY "Users_Manage_Own_Todos" ON public.todos FOR ALL 
USING ((select auth.uid()) = "userId") 
WITH CHECK ((select auth.uid()) = "userId");

-- 2. USER CLAIMS (User Access)
CREATE POLICY "Users_Manage_Own_Claims" ON public.user_claims FOR ALL 
USING ((select auth.uid()) = "userId") 
WITH CHECK ((select auth.uid()) = "userId");

-- 3. COMMENTS & GUIDES (User Content)
-- Allow Inserts for any authenticated user
CREATE POLICY "Auth_Insert_Comments" ON public.comments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Public_View_Comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users_Delete_Own_Comments" ON public.comments FOR DELETE USING ((select auth.uid())::text = address); -- loose check

CREATE POLICY "Auth_Insert_Guides" ON public.guides FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Public_View_Guides" ON public.guides FOR SELECT USING (true);
CREATE POLICY "Users_Edit_Own_Guides" ON public.guides FOR UPDATE USING ((select auth.uid())::text = author); -- loose check

-- 4. MESSAGES / EVENTS (Admin Managed, Public View)
-- Checking Both 'role' AND 'memberStatus' for Admin rights to be safe
CREATE POLICY "Public_View_Messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Admins_Manage_Messages" ON public.messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

CREATE POLICY "Public_View_Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins_Manage_Events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

-- (Legacy Names Support)
CREATE POLICY "Public_View_Calendar" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Admins_Manage_Calendar" ON public.calendar_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

CREATE POLICY "Users_View_Own_Inbox" ON public.inbox_messages FOR SELECT USING ((select auth.uid()) = "userId");
CREATE POLICY "Admins_Insert_Inbox" ON public.inbox_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

-- 5. AIRDROP REQUESTS (User Submit)
CREATE POLICY "Auth_Submit_Requests" ON public.airdrop_requests FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Admins_Manage_Requests" ON public.airdrop_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

-- 6. USERS (Profile Updates)
-- Allow users to update their own profile (including trackedProjectIds)
-- Note: SELECT is "Public profiles viewable" for all
CREATE POLICY "Public_View_Profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users_Update_Self" ON public.users FOR UPDATE USING ((select auth.uid()) = id);

-- 7. ACTIVITIES / AIRDROPS (Public Read, Admin Write)
-- Ensure these aren't locked either
CREATE POLICY "Public_View_Activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Admins_Manage_Activities" ON public.activities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

CREATE POLICY "Public_View_Airdrops" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Admins_Manage_Airdrops" ON public.airdrops FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin')))
);

-- 8. Fix Admin Function (Optional but good)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
