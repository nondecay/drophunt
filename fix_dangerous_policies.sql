-- Clean up dangerous/duplicate policies identified in security audit
-- These policies allow unrestricted access (Nuclear/Public All) which overrides secure policies.

-- ACTIVITIES
DROP POLICY IF EXISTS "Public Activities All" ON public.activities;

-- AIRDROP REQUESTS
-- "Public Requests All" allows modification/deletion. "Anyone can submit" is acceptable for INSERT if intended.
DROP POLICY IF EXISTS "Public Requests All" ON public.airdrop_requests;

-- AIRDROPS
DROP POLICY IF EXISTS "Admin All Airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Admins manage airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Public Airdrops All" ON public.airdrops;

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Public Announcements All" ON public.announcements;

-- CHAINS
DROP POLICY IF EXISTS "Public Chains All" ON public.chains;

-- CLAIMS
DROP POLICY IF EXISTS "Public Claims All" ON public.claims;

-- COMMENTS
DROP POLICY IF EXISTS "Admin Update Comments" ON public.comments;
DROP POLICY IF EXISTS "Public Comments All" ON public.comments;
DROP POLICY IF EXISTS "Public comments access" ON public.comments;
DROP POLICY IF EXISTS "User Delete Own Comment" ON public.comments; -- Replaced by secure policy
DROP POLICY IF EXISTS "User Insert Comments" ON public.comments; -- Replaced by secure policy

-- EVENTS
DROP POLICY IF EXISTS "Admin Manage Events" ON public.events; -- Use 'calendar_events' table name if that's what it is, but user said 'events'?? Schema says 'events' table exists in seed but table def is 'calendar_events'. Let's try both names just in case.
DROP POLICY IF EXISTS "Public events access" ON public.events;
DROP POLICY IF EXISTS "Admin Manage Events" ON public.calendar_events;
DROP POLICY IF EXISTS "Public events access" ON public.calendar_events;

-- GUIDES
DROP POLICY IF EXISTS "Admin Update Guides" ON public.guides;
DROP POLICY IF EXISTS "Public Guides All" ON public.guides;
DROP POLICY IF EXISTS "Public guides access" ON public.guides;
DROP POLICY IF EXISTS "User Insert Guides" ON public.guides;

-- INFOFI PLATFORMS
DROP POLICY IF EXISTS "Public Infofi All" ON public.infofi_platforms;

-- INVESTORS
DROP POLICY IF EXISTS "Public Investors All" ON public.investors;

-- MESSAGES (Legacy/Ghost table)
DROP POLICY IF EXISTS "Nuclear Allow All Messages" ON public.messages;
DROP POLICY IF EXISTS "Nuclear Allow All Messages" ON public.inbox_messages;

-- AIRDROP REQUESTS
-- Replacing overly permissive "Anyone can submit" (true) with "Authenticated users"
DROP POLICY IF EXISTS "Anyone can submit requests" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Public Requests All" ON public.airdrop_requests;
-- Re-creating safe policy (if not exists, error suppressed by IF NOT EXISTS logic in DROP, but we need CREATE)
-- We will add a separate creation step or just run this to clean and rely on schema.sql to have the 'right' one? 
-- No, schema.sql had the BAD one. I need to CREATE the GOOD one here or user loses functionality.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'airdrop_requests' AND policyname = 'Authenticated can submit requests') THEN
        CREATE POLICY "Authenticated can submit requests" ON public.airdrop_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- TODOS
DROP POLICY IF EXISTS "Nuclear Allow All Todos" ON public.todos;
DROP POLICY IF EXISTS "User Manage Own Todos" ON public.todos; -- This duplicate had open access
DROP POLICY IF EXISTS "Users can manage own todos" ON public.todos; -- Check precise name match

-- TOOLS
DROP POLICY IF EXISTS "Public Tools All" ON public.tools;

-- USER CLAIMS
DROP POLICY IF EXISTS "Nuclear Allow All Claims" ON public.user_claims;
DROP POLICY IF EXISTS "User Manage Own Claims" ON public.user_claims;

-- USERS
DROP POLICY IF EXISTS "Insert Users" ON public.users;
DROP POLICY IF EXISTS "Public users access" ON public.users;
DROP POLICY IF EXISTS "Public Users All" ON public.users; -- Newly reported

-- TODOS
DROP POLICY IF EXISTS "Public todos access" ON public.todos; -- Newly reported

-- USER CLAIMS
DROP POLICY IF EXISTS "Public claims access" ON public.user_claims; -- Newly reported
