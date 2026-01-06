
-- FIX RLS POLICIES FOR ADMIN PANEL (ANON/PUBLIC ACCESS)
-- Corrected: 'requests' table changed to 'airdrop_requests' to match schema.sql

-- 1. Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infofi_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_requests ENABLE ROW LEVEL SECURITY; -- Changed from requests

-- 2. Drop existing policies to avoid conflicts (Clean Slate)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;
DROP POLICY IF EXISTS "Public read airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
DROP POLICY IF EXISTS "Public read claims" ON public.claims;
DROP POLICY IF EXISTS "Anon insert comments" ON public.comments;
DROP POLICY IF EXISTS "Public requests All" ON public.airdrop_requests;

-- 3. Create "OPEN" Policies for EVERY table needed by Admin Panel

-- USERS
CREATE POLICY "Public Users All" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- AIRDROPS
CREATE POLICY "Public Airdrops All" ON public.airdrops FOR ALL USING (true) WITH CHECK (true);

-- COMMENTS
CREATE POLICY "Public Comments All" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- CLAIMS
CREATE POLICY "Public Claims All" ON public.claims FOR ALL USING (true) WITH CHECK (true);

-- INFOFI PLATFORMS
CREATE POLICY "Public Infofi All" ON public.infofi_platforms FOR ALL USING (true) WITH CHECK (true);

-- INVESTORS
CREATE POLICY "Public Investors All" ON public.investors FOR ALL USING (true) WITH CHECK (true);

-- ANNOUNCEMENTS
CREATE POLICY "Public Announcements All" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- TOOLS
CREATE POLICY "Public Tools All" ON public.tools FOR ALL USING (true) WITH CHECK (true);

-- ACTIVITIES (GM, Mint, etc.)
CREATE POLICY "Public Activities All" ON public.activities FOR ALL USING (true) WITH CHECK (true);

-- CHAINS
CREATE POLICY "Public Chains All" ON public.chains FOR ALL USING (true) WITH CHECK (true);

-- GUIDES
CREATE POLICY "Public Guides All" ON public.guides FOR ALL USING (true) WITH CHECK (true);

-- REQUESTS (Mapped to airdrop_requests)
CREATE POLICY "Public Requests All" ON public.airdrop_requests FOR ALL USING (true) WITH CHECK (true);


-- 4. Grant Usage to Anon Role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
