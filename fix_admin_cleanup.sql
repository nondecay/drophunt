/*
  # ADMIN PANEL & CONTENT FIX (KILL SWITCH V2)
  # --------------------------------------------------------------------------------
  # The Admin Panel uses many tables that were likely left locked by previous RLS fixes.
  # This script creates a 'Green Laning' for all content tables to ensure Admins (and users)
  # can read/write without RLS blocking them, as requested to restore functionality.
*/

-- 1. Disable RLS on all Content Tables
ALTER TABLE IF EXISTS "airdrops" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "activities" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "chains" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "claims" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "guides" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "infofi_platforms" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "investors" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "announcements" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "tools" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "events" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "airdrop_requests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "messages" DISABLE ROW LEVEL SECURITY;       -- FIX: Added for Broadcasts
ALTER TABLE IF EXISTS "inbox_messages" DISABLE ROW LEVEL SECURITY; -- FIX: Added for User Inbox

-- 2. Drop any lingering policies that might confuse things (Optional but safe)
DROP POLICY IF EXISTS "Enable all access" ON "airdrops";
DROP POLICY IF EXISTS "Enable all access" ON "activities";
DROP POLICY IF EXISTS "Enable all access" ON "chains";
-- (We use the Loop cleaner in other scripts, but explicit disabled RLS overrides policies anyway)

-- 3. Explicitly Grant Permissions (Crucial if RLS is off but Grants are missing)
GRANT ALL ON TABLE "airdrops" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "activities" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "chains" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "claims" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "comments" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "guides" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "infofi_platforms" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "investors" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "announcements" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "tools" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "users" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "events" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "airdrop_requests" TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE "messages" TO postgres, anon, authenticated, service_role;       -- FIX
GRANT ALL ON TABLE "inbox_messages" TO postgres, anon, authenticated, service_role; -- FIX

-- 4. Grant Sequence Permissions (Fixes "permission denied for sequence" errors on INSERT)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Verify RLS Status (This will output the status of 3 key tables to confirm)
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('airdrops', 'users', 'comments');
