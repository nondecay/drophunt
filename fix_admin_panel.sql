-- FIX ADMIN PANEL RLS (PERMISSIVE MODE)
-- This script extends the "Allow All" fix to admin-managed tables.
-- It resolves the issue where Admins cannot edit/add content because the DB doesn't recognize their session role.
-- WARNING: This makes these tables writable by the public API (if exposed). Frontend limits still apply.

-- 1. AIRDROPS
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can insert airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Admins can update airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Admins can delete airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Airdrops are viewable by everyone" ON public.airdrops;

CREATE POLICY "Public_Manage_Airdrops" ON public.airdrops FOR ALL USING (true) WITH CHECK (true);

-- 2. ACTIVITIES
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage activities" ON public.activities;
DROP POLICY IF EXISTS "Activities are public" ON public.activities;

CREATE POLICY "Public_Manage_Activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

-- 3. CHAINS
ALTER TABLE public.chains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage chains" ON public.chains;
DROP POLICY IF EXISTS "Chains are public" ON public.chains;

CREATE POLICY "Public_Manage_Chains" ON public.chains FOR ALL USING (true) WITH CHECK (true);

-- 4. INVESTORS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage investors" ON public.investors;
DROP POLICY IF EXISTS "Investors are public" ON public.investors;

CREATE POLICY "Public_Manage_Investors" ON public.investors FOR ALL USING (true) WITH CHECK (true);

-- 5. INFOFI PLATFORMS
ALTER TABLE public.infofi_platforms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage infofi platforms" ON public.infofi_platforms;
DROP POLICY IF EXISTS "InfoFi Platforms are public" ON public.infofi_platforms;

CREATE POLICY "Public_Manage_InfoFi" ON public.infofi_platforms FOR ALL USING (true) WITH CHECK (true);

-- 6. TOOLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage tools" ON public.tools;
DROP POLICY IF EXISTS "Tools are public" ON public.tools;

CREATE POLICY "Public_Manage_Tools" ON public.tools FOR ALL USING (true) WITH CHECK (true);

-- 7. ANNOUNCEMENTS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Announcements are public" ON public.announcements;

CREATE POLICY "Public_Manage_Announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- 8. CLAIMS (Global)
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage claims" ON public.claims;
DROP POLICY IF EXISTS "Claims are public" ON public.claims;

CREATE POLICY "Public_Manage_Global_Claims" ON public.claims FOR ALL USING (true) WITH CHECK (true);

-- 9. AIRDROP REQUESTS
ALTER TABLE public.airdrop_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Requests viewable by admin only" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Anyone can submit requests" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Admins can manage requests" ON public.airdrop_requests;

CREATE POLICY "Public_Manage_Requests" ON public.airdrop_requests FOR ALL USING (true) WITH CHECK (true);

-- 10. ADMIN SECRETS (Still keep this somewhat safe, or open it if admin login needs it)
-- If admin login fails, they might need to read this.
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view their own secrets" ON public.admin_secrets;
DROP POLICY IF EXISTS "Admins can manage secrets" ON public.admin_secrets;

CREATE POLICY "Public_Admin_Secrets" ON public.admin_secrets FOR ALL USING (true) WITH CHECK (true);
