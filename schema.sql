-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS TABLE with Strict RBAC
CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar TEXT,
  role user_role DEFAULT 'user',
  "isAdmin" BOOLEAN GENERATED ALWAYS AS (role = 'admin') STORED,
  
  -- Legacy / RPG Stats compatibility
  uid SERIAL,
  "memberStatus" TEXT DEFAULT 'Hunter',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hp INTEGER DEFAULT 150,
  mp INTEGER DEFAULT 70,
  strength INTEGER DEFAULT 5,
  defense INTEGER DEFAULT 5,
  "trackedProjectIds" TEXT[] DEFAULT '{}',
  "lastActivities" JSONB DEFAULT '{}'::jsonb,
  "lastUsernameChange" BIGINT DEFAULT 0,
  "lastCommentTimestamps" JSONB DEFAULT '{}'::jsonb,
  "bannedUntil" BIGINT,
  "isPermaBanned" BOOLEAN DEFAULT FALSE,
  "registeredAt" BIGINT DEFAULT extract(epoch from now()) * 1000,
  
  PRIMARY KEY (id)
);

-- ADMIN SECRETS (Strict Security)
CREATE TABLE public.admin_secrets (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  password_hash TEXT,
  failed_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can create their profile" ON public.users FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((select auth.uid()) = id); 
CREATE POLICY "Admins can update everything" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
);
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can view their own secrets" ON public.admin_secrets FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins can manage secrets" ON public.admin_secrets FOR ALL USING ((select auth.uid()) = user_id); 


-- AIRDROPS TABLE
CREATE TYPE airdrop_type AS ENUM ('Gas Only', 'Waitlist', 'Free', 'Paid', 'Testnet');
CREATE TYPE airdrop_status AS ENUM ('Potential', 'Claim Available');

CREATE TABLE public.airdrops (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  icon TEXT,
  investment TEXT,
  type airdrop_type NOT NULL,
  status airdrop_status DEFAULT 'Potential',
  "hasInfoFi" BOOLEAN DEFAULT FALSE,
  rating NUMERIC DEFAULT 0,
  "voteCount" INTEGER DEFAULT 0,
  
  platform TEXT,
  "projectInfo" TEXT,
  "campaignUrl" TEXT,
  "claimUrl" TEXT,
  "potentialReward" TEXT,
  
  socials JSONB DEFAULT '{}'::jsonb,
  "topUsers" JSONB DEFAULT '[]'::jsonb,
  
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000,
  "backerIds" TEXT[] DEFAULT '{}',
  investors TEXT[] DEFAULT '{}' -- Legacy field
);

-- HELPER FUNCTION FOR ADMIN CHECK
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- AIRDROPS POLICIES
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Airdrops are viewable by everyone" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Admins can insert airdrops" ON public.airdrops FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update airdrops" ON public.airdrops FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete airdrops" ON public.airdrops FOR DELETE USING (public.is_admin());

-- CHAINS
CREATE TABLE public.chains (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  "chainId" INTEGER,
  "rpcUrl" TEXT,
  "explorerUrl" TEXT,
  "isTestnet" BOOLEAN DEFAULT FALSE,
  logo TEXT,
  "nativeCurrency" TEXT
);
ALTER TABLE public.chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chains are public" ON public.chains FOR SELECT USING (true);
CREATE POLICY "Admins can manage chains" ON public.chains FOR ALL USING (public.is_admin());

-- INVESTORS (VCs)
CREATE TABLE public.investors (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  logo TEXT,
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000
);
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors are public" ON public.investors FOR SELECT USING (true);
CREATE POLICY "Admins can manage investors" ON public.investors FOR ALL USING (public.is_admin());

-- INFOFI PLATFORMS
CREATE TABLE public.infofi_platforms (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  logo TEXT
);
ALTER TABLE public.infofi_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "InfoFi Platforms are public" ON public.infofi_platforms FOR SELECT USING (true);
CREATE POLICY "Admins can manage infofi platforms" ON public.infofi_platforms FOR ALL USING (public.is_admin());

-- TOOLS
CREATE TYPE tool_category AS ENUM ('Research', 'Security', 'Dex Data', 'Wallets', 'Bots', 'Track Assets');
CREATE TABLE public.tools (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  link TEXT,
  category tool_category
);
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tools are public" ON public.tools FOR SELECT USING (true);
CREATE POLICY "Admins can manage tools" ON public.tools FOR ALL USING (public.is_admin());

-- ACTIVITIES (Mapped from OnChainActivity)
CREATE TYPE activity_type AS ENUM ('gm', 'mint', 'deploy', 'rpg');
CREATE TABLE public.activities (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  type activity_type NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  "chainId" INTEGER,
  "contractAddress" TEXT,
  color TEXT,
  "extraXP" INTEGER DEFAULT 0,
  "isTestnet" BOOLEAN DEFAULT FALSE,
  "nftImage" TEXT,
  abi JSONB,
  "mintFee" TEXT,
  "functionName" TEXT,
  badge TEXT
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities are public" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Admins can manage activities" ON public.activities FOR ALL USING (public.is_admin());

-- COMMENTS
CREATE TABLE public.comments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "airdropId" TEXT REFERENCES public.airdrops(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  username TEXT,
  avatar TEXT,
  content TEXT NOT NULL,
  rating NUMERIC,
  "createdAtTimestamp" BIGINT DEFAULT extract(epoch from now()) * 1000,
  "createdAt" TEXT,
  "isApproved" BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Admins can manage comments" ON public.comments FOR ALL USING (public.is_admin());

-- TODO ITEMS
CREATE TABLE public.todos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "airdropId" TEXT REFERENCES public.airdrops(id) ON DELETE CASCADE,
  note TEXT,
  completed BOOLEAN DEFAULT FALSE,
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000,
  reminder TEXT, -- 'none' | 'daily' | 'weekly' | 'monthly'
  deadline TEXT
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own todos" ON public.todos USING ((select auth.uid()) = "userId");

-- USER CLAIMS (Tracked Claims / UserClaim)
CREATE TABLE public.user_claims (
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
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own claims" ON public.user_claims USING ((select auth.uid()) = "userId");

-- GUIDES
CREATE TABLE public.guides (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "airdropId" TEXT REFERENCES public.airdrops(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  author TEXT,
  url TEXT NOT NULL,
  lang TEXT DEFAULT 'en',
  "countryCode" TEXT DEFAULT 'us',
  "isApproved" BOOLEAN DEFAULT FALSE,
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000,
  title TEXT
);
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guides are public" ON public.guides FOR SELECT USING (true);
CREATE POLICY "Users can submit guides" ON public.guides FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Admins can manage guides" ON public.guides FOR ALL USING (public.is_admin());

-- INBOX MESSAGES
CREATE TABLE public.inbox_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  type TEXT,
  timestamp BIGINT DEFAULT extract(epoch from now()) * 1000,
  "isRead" BOOLEAN DEFAULT FALSE,
  "relatedAirdropId" TEXT
);
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their inbox" ON public.inbox_messages FOR SELECT USING ((select auth.uid()) = "userId");
CREATE POLICY "Admins can send messages" ON public.inbox_messages FOR INSERT WITH CHECK (public.is_admin());

-- AIRDROP REQUESTS
CREATE TABLE public.airdrop_requests (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  funding TEXT,
  "twitterLink" TEXT,
  "isInfoFi" BOOLEAN DEFAULT FALSE,
  address TEXT, -- submitter address
  timestamp BIGINT DEFAULT extract(epoch from now()) * 1000
);
ALTER TABLE public.airdrop_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests viewable by admin only" ON public.airdrop_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "Anyone can submit requests" ON public.airdrop_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage requests" ON public.airdrop_requests FOR ALL USING (public.is_admin());

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  text TEXT NOT NULL,
  emoji TEXT,
  link TEXT
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are public" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin());

-- CLAIMS (Global / Calendar Claims)
CREATE TABLE public.claims (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "projectName" TEXT NOT NULL,
  icon TEXT,
  link TEXT,
  type TEXT,
  fdv TEXT,
  whitelist TEXT,
  "isUpcoming" BOOLEAN DEFAULT FALSE,
  deadline TEXT,
  "startDate" TEXT
);
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims are public" ON public.claims FOR SELECT USING (true);
CREATE POLICY "Admins can manage claims" ON public.claims FOR ALL USING (public.is_admin());

-- CALENDAR EVENTS
CREATE TABLE public.calendar_events (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT,
  description TEXT,
  url TEXT
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage calendar events" ON public.calendar_events FOR ALL USING (public.is_admin());

-- SEED DATA
INSERT INTO public.infofi_platforms (id, name, logo) VALUES
('1', 'Wallchain', ''),
('2', 'Kaito', ''),
('3', 'Cookie3', ''),
('4', 'Bantr', '')
ON CONFLICT (id) DO NOTHING;
