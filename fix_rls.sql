
-- FIX RLS POLICIES FOR WALLET AUTH (ANON/PUBLIC ACCESS)

-- 1. Enable RLS on users table (ensure it's on)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing strict policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Allow individual insert" ON public.users;

-- 3. Create OPEN policies for the 'users' table
-- Since we identify users by 'address' column and rely on client-side wallet signature for 'verification' (in AppContext),
-- we need to allow the Anon client to Read/Write to the users table.
-- Ideally we would use Edge Functions for secure updates, but for this "Direct Supabase" migration:

-- Allow finding users (Login check)
CREATE POLICY "Enable read access for all users" ON public.users
FOR SELECT USING (true);

-- Allow registration (SyncUser)
CREATE POLICY "Enable insert for all users" ON public.users
FOR INSERT WITH CHECK (true);

-- Allow updates (XP, Username, Avatar)
-- Note: In a production V2, we should move 'gainXP' to a secure Postgres Function.
-- For now, allow updates so the app works.
CREATE POLICY "Enable update for all users" ON public.users
FOR UPDATE USING (true);


-- 4. Fix Content Tables (Comments, etc) similarly if needed
-- Allow anyone to READ content
CREATE POLICY "Public read airdrops" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public read claims" ON public.claims FOR SELECT USING (true);

-- Allow anyone to INSERT comments (if they are logged in context, but DB sees anon)
CREATE POLICY "Anon insert comments" ON public.comments FOR INSERT WITH CHECK (true);

-- Grant usage to anon role explicitly
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

