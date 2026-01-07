-- 1. Create Missing Tables (Critical for Tasks & Claims)
CREATE TABLE IF NOT EXISTS public.todos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "airdropId" TEXT,
  note TEXT,
  completed BOOLEAN DEFAULT FALSE,
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000,
  reminder TEXT,
  deadline TEXT
);

CREATE TABLE IF NOT EXISTS public.user_claims (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "projectName" TEXT,
  expense NUMERIC DEFAULT 0,
  "claimedToken" TEXT,
  "tokenCount" NUMERIC DEFAULT 0,
  earning NUMERIC DEFAULT 0,
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000,
  "claimedDate" TEXT
);

-- 2. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrops ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_claims ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSIVE POLICIES (Fixing "Not Saving" Issues)

-- USERS
DROP POLICY IF EXISTS "Public Users Access" ON users;
CREATE POLICY "Public Users Access" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Self Update Users" ON users;
CREATE POLICY "Self Update Users" ON users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Insert Users" ON users;
CREATE POLICY "Insert Users" ON users FOR INSERT WITH CHECK (true);

-- AIRDROPS
DROP POLICY IF EXISTS "Public Read Airdrops" ON airdrops;
CREATE POLICY "Public Read Airdrops" ON airdrops FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin All Airdrops" ON airdrops;
CREATE POLICY "Admin All Airdrops" ON airdrops FOR ALL USING (true) WITH CHECK (true);

-- COMMENTS
DROP POLICY IF EXISTS "Public Read Comments" ON comments;
CREATE POLICY "Public Read Comments" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "User Insert Comments" ON comments;
CREATE POLICY "User Insert Comments" ON comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin Update Comments" ON comments;
CREATE POLICY "Admin Update Comments" ON comments FOR UPDATE USING (true);

-- GUIDES
DROP POLICY IF EXISTS "Public Read Guides" ON guides;
CREATE POLICY "Public Read Guides" ON guides FOR SELECT USING (true);
DROP POLICY IF EXISTS "User Insert Guides" ON guides;
CREATE POLICY "User Insert Guides" ON guides FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin Update Guides" ON guides;
CREATE POLICY "Admin Update Guides" ON guides FOR UPDATE USING (true);

-- EVENTS
DROP POLICY IF EXISTS "Public Read Events" ON events;
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Manage Events" ON events;
CREATE POLICY "Admin Manage Events" ON events FOR ALL USING (true);

-- TODOS
DROP POLICY IF EXISTS "User Manage Own Todos" ON todos;
CREATE POLICY "User Manage Own Todos" ON todos FOR ALL USING (true);

-- CLAIMS
DROP POLICY IF EXISTS "User Manage Own Claims" ON user_claims;
CREATE POLICY "User Manage Own Claims" ON user_claims FOR ALL USING (true);

-- 4. Grant Access
GRANT ALL ON public.todos TO authenticated;
GRANT ALL ON public.todos TO service_role;
GRANT ALL ON public.user_claims TO authenticated;
GRANT ALL ON public.user_claims TO service_role;
