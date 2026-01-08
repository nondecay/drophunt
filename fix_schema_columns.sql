-- FIX MISSING COLUMNS & FOREIGN KEYS (SAFE MODE)

-- 1. Add missing columns to 'messages' if they don't exist
-- We use DO block to handle "ADD COLUMN IF NOT EXISTS" safely in older Postgres versions if needed, 
-- but IF NOT EXISTS is standard in modern Postgres.

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "relatedAirdropId" TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "targetRole" TEXT DEFAULT 'all';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "authorId" UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'broadcast';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "expiresAt" BIGINT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT (extract(epoch from now()) * 1000);

-- 2. Fix 'user_claims' FK to point to PUBLIC.users (not Auth)
-- Drop old constraint if exists
ALTER TABLE public.user_claims DROP CONSTRAINT IF EXISTS user_claims_user_id_fkey;

-- Add correct constraint
ALTER TABLE public.user_claims 
    ADD CONSTRAINT user_claims_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;

-- 3. Fix 'messages' FK to point to PUBLIC.users
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_authorId_fkey;

ALTER TABLE public.messages 
    ADD CONSTRAINT messages_authorId_fkey 
    FOREIGN KEY ("authorId") 
    REFERENCES public.users(id) 
    ON DELETE SET NULL;

-- 4. Re-Apply Permissions (Just in case)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nuclear Allow All Messages" ON public.messages;
CREATE POLICY "Nuclear Allow All Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Nuclear Allow All Claims" ON public.user_claims;
CREATE POLICY "Nuclear Allow All Claims" ON public.user_claims FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.messages TO anon, authenticated, service_role;
GRANT ALL ON public.user_claims TO anon, authenticated, service_role;
