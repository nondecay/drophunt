-- FIX PERSISTENCE FOR TASKS, CLAIMS AND COMMENTS

-- 1. Create Missing Tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.todos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "airdropId" TEXT REFERENCES public.airdrops(id) ON DELETE CASCADE,
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

-- 2. Update Comments to Require Approval by Default (Security)
ALTER TABLE public.comments ALTER COLUMN "isApproved" SET DEFAULT FALSE;

-- 3. Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

-- 4. Fix/Reset Policies
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users manage own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users manage own claims" ON public.user_claims;

-- Create explicit policies allowing Insert/Update/Delete for owners
CREATE POLICY "Users manage own todos" ON public.todos
FOR ALL
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users manage own claims" ON public.user_claims
FOR ALL
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- 5. Grant Permissions
GRANT ALL ON public.todos TO authenticated;
GRANT ALL ON public.todos TO service_role;
GRANT ALL ON public.user_claims TO authenticated;
GRANT ALL ON public.user_claims TO service_role;

-- 6. Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
