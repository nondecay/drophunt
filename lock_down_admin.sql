-- LOCK DOWN ADMIN TABLES
-- Replaces "Public_Manage_*" policies with "Strict_Manage_*" checks.
-- Only allows users with role='admin' to modify data.
-- Public can still VIEW (SELECT) consistent with a public website.

-- Helper: Check for Admin Role directly
-- We use: (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'

-- 1. AIRDROPS
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Airdrops" ON public.airdrops;

CREATE POLICY "Strict_Manage_Airdrops" ON public.airdrops FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Airdrops" ON public.airdrops FOR SELECT USING (true);


-- 2. ACTIVITIES
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Activities" ON public.activities;

CREATE POLICY "Strict_Manage_Activities" ON public.activities FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Activities" ON public.activities FOR SELECT USING (true);


-- 3. CHAINS
ALTER TABLE public.chains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Chains" ON public.chains;

CREATE POLICY "Strict_Manage_Chains" ON public.chains FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Chains" ON public.chains FOR SELECT USING (true);


-- 4. INVESTORS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Investors" ON public.investors;

CREATE POLICY "Strict_Manage_Investors" ON public.investors FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Investors" ON public.investors FOR SELECT USING (true);


-- 5. INFOFI PLATFORMS
ALTER TABLE public.infofi_platforms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_InfoFi" ON public.infofi_platforms;

CREATE POLICY "Strict_Manage_InfoFi" ON public.infofi_platforms FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_InfoFi" ON public.infofi_platforms FOR SELECT USING (true);


-- 6. TOOLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Tools" ON public.tools;

CREATE POLICY "Strict_Manage_Tools" ON public.tools FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Tools" ON public.tools FOR SELECT USING (true);


-- 7. ANNOUNCEMENTS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Announcements" ON public.announcements;

CREATE POLICY "Strict_Manage_Announcements" ON public.announcements FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Announcements" ON public.announcements FOR SELECT USING (true);


-- 8. GLOBAL CLAIMS (If used globally)
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Global_Claims" ON public.claims;

CREATE POLICY "Strict_Manage_Global_Claims" ON public.claims FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public_View_Global_Claims" ON public.claims FOR SELECT USING (true);


-- 9. AIRDROP REQUESTS (User submits, Admin View/Edit)
ALTER TABLE public.airdrop_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Manage_Requests" ON public.airdrop_requests;

-- Anyone can submit (INSERT)
CREATE POLICY "Public_Submit_Requests" ON public.airdrop_requests FOR INSERT WITH CHECK (true);
-- Only Admin can VIEW/UPDATE/DELETE
CREATE POLICY "Strict_Manage_Requests" ON public.airdrop_requests FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Strict_Update_Requests" ON public.airdrop_requests FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Strict_Delete_Requests" ON public.airdrop_requests FOR DELETE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 10. MESSAGES (Broadcasts)
-- Handled in previous script generally, but let's reinforce.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- Keep "Public_View_Messages" if exists, ensure admin write only.
DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
CREATE POLICY "Strict_Admin_Insert_Messages" ON public.messages FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
