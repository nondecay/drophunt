-- COMPREHENSIVE FIX FOR PERSISTENCE & ADMIN (V4)
-- Run this script in Supabase SQL Editor to resolve all persistence issues.

-- 1. DROP RESTRICTIVE POLICIES (Start Fresh for affected tables)
DROP POLICY IF EXISTS "Users manage own todos" ON public.todos;
DROP POLICY IF EXISTS "Users manage own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users manage own comments" ON public.comments;
DROP POLICY IF EXISTS "Users manage own guides" ON public.guides;
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
DROP POLICY IF EXISTS "Users manage own info" ON public.users;

-- 2. LOOSEN FOREIGN KEY CONSTRAINTS
-- We allow 'todo', 'user_claims', etc. to reference public.users(id) NOT auth.users(id).
-- This is critical for wallet-only auth where a pure Supabase Auth user might not exist yet.
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_userId_fkey;
ALTER TABLE public.user_claims DROP CONSTRAINT IF EXISTS user_claims_userId_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_userId_fkey;
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_userId_fkey;

-- 3. OPEN RLS POLICIES (Allow public/anon writes if application logic allows)
-- In a stricter app, we'd verify signatures in Edge Functions.
-- For this Phase, we trust the client's 'userId' or 'address'.

-- TABLES: todos, user_claims, comments, guides, events, users

-- A. USERS TABLE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- B. TODOS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public todos access" ON public.todos FOR ALL USING (true) WITH CHECK (true);

-- C. USER_CLAIMS
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public claims access" ON public.user_claims FOR ALL USING (true) WITH CHECK (true);

-- D. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments access" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- E. GUIDES
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public guides access" ON public.guides FOR ALL USING (true) WITH CHECK (true);

-- F. EVENTS (Calendar)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public events access" ON public.events FOR ALL USING (true) WITH CHECK (true);

-- 4. ENSURE NECESSARY COLUMNS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "lastCommentTimestamps" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.airdrops ADD COLUMN IF NOT EXISTS "topUsers" JSONB DEFAULT '[]'::jsonb;

-- 5. FIX AIRDROPS/INFOFI PERSISTENCE (If needed)
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view airdrops" ON public.airdrops;
CREATE POLICY "Public view airdrops" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Admins manage airdrops" ON public.airdrops FOR ALL USING (true) WITH CHECK (true); 
-- Note: 'Admins manage airdrops' above is technically open to all for now to ensure Admin Panel works without complex Auth setup. 
-- You might want to restrict this later.
