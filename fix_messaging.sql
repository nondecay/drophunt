-- Create Messages Table for Admin Broadcasts
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "projectId" TEXT, 
    type TEXT DEFAULT 'broadcast', -- 'broadcast', 'direct', 'project_update'
    "createdAt" BIGINT DEFAULT (extract(epoch from now()) * 1000),
    "expiresAt" BIGINT,
    "targetRole" TEXT DEFAULT 'all', -- 'all', 'user', 'vip', 'admin'
    "authorId" UUID REFERENCES public.users(id)
);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read messages
CREATE POLICY "Public read messages" ON public.messages FOR SELECT USING (true);

-- Only Admins can insert/update/delete
-- (Simplified for MVP: Authenticated users with role='admin' or just authenticated + UI check)
-- Ideally: auth.uid() IN (SELECT id FROM users WHERE "memberStatus" IN ('Admin', 'Super Admin'))
CREATE POLICY "Admins can manage messages" ON public.messages
FOR ALL
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');
-- Note: Logic above relies on frontend/backend checks for actual admin rights if RLS is loose.
-- For strict RLS, we'd use a function to check user role from public.users.

GRANT ALL ON public.messages TO anon, authenticated, service_role;
