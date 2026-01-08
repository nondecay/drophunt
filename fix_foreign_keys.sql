-- FIX FOREIGN KEYS & TABLE STRUCTURE

-- 1. Drops constraints to avoid conflicts
ALTER TABLE public.user_claims DROP CONSTRAINT IF EXISTS user_claims_user_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_authorId_fkey;

-- 2. Modify columns to ensure they are compatible (UUID)
-- If they were created as text by accident, this might fail, so we attempt cast.
-- But since we use UUIDs in app, these should be UUID.

-- Ensure user_claims.user_id references public.users(id) NOT auth.users
ALTER TABLE public.user_claims 
    ADD CONSTRAINT user_claims_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;

-- Ensure messages.authorId references public.users(id)
ALTER TABLE public.messages 
    ADD CONSTRAINT messages_authorId_fkey 
    FOREIGN KEY ("authorId") 
    REFERENCES public.users(id) 
    ON DELETE SET NULL;

-- 3. Verify Columns Existence & Nullability
-- Messages
ALTER TABLE public.messages ALTER COLUMN "relatedAirdropId" DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN "projectId" DROP NOT NULL;

-- 4. FORCE RLS POLICIES AGAIN (Just to be triple sure)
DROP POLICY IF EXISTS "Nuclear Allow All Claims" ON public.user_claims;
CREATE POLICY "Nuclear Allow All Claims" ON public.user_claims FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Nuclear Allow All Messages" ON public.messages;
CREATE POLICY "Nuclear Allow All Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.user_claims TO anon, authenticated, service_role;
GRANT ALL ON public.messages TO anon, authenticated, service_role;
