
-- FIX WALLET ARCHITECTURE
-- The previous schema assumed usage of Supabase Auth (Email/Pass).
-- Since we use Wallet Auth, we must decouple public.users from auth.users.

-- 1. Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Decouple public.users from auth.users
-- This allows us to insert users via Wallet Address without them existing in Supabase Auth.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Fix Foreign Keys in other tables to point to public.users instead of auth.users
-- TODOS
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS "todos_userId_fkey";
ALTER TABLE public.todos ADD CONSTRAINT "todos_userId_public_fkey" 
FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- USER CLAIMS
ALTER TABLE public.user_claims DROP CONSTRAINT IF EXISTS "user_claims_userId_fkey";
ALTER TABLE public.user_claims ADD CONSTRAINT "user_claims_userId_public_fkey" 
FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- INBOX MESSAGES
ALTER TABLE public.inbox_messages DROP CONSTRAINT IF EXISTS "inbox_messages_userId_fkey";
ALTER TABLE public.inbox_messages ADD CONSTRAINT "inbox_messages_userId_public_fkey" 
FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Re-apply RLS Policies just in case
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;

CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true);

-- 5. Fix Admin Secrets FK (It was already correct pointing to public.users, but good to check)
-- It references public.users(id), so it is fine.

-- 6. Insert Default Admin (Optional/Backup)
-- Since we decoupled, we can now insert a user just by address if we wanted.
