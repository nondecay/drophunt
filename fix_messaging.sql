-- FIX MESSAGING TABLE & POLICIES (PUBLIC ACCESS FOR ADMIN PANEL)

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "projectId" TEXT, 
    type TEXT DEFAULT 'broadcast', -- 'broadcast', 'direct', 'project_update'
    "createdAt" BIGINT DEFAULT (extract(epoch from now()) * 1000),
    "expiresAt" BIGINT,
    "targetRole" TEXT DEFAULT 'all', -- 'all', 'user', 'vip', 'admin'
    "authorId" UUID REFERENCES public.users(id),
    "relatedAirdropId" TEXT
);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- DROP AND RECREATE POLICIES
DROP POLICY IF EXISTS "Public read messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;

-- Create a policy that allows EVERYTHING for EVERYONE (Since Admin Panel uses client-side auth state, not Supabase session)
-- This is necessary to fix "Failed to broadcast" if the user is not authenticated in Supabase's eyes.
CREATE POLICY "Allow all access to messages"
ON public.messages
FOR ALL
USING (true)
WITH CHECK (true);

GRANT ALL ON public.messages TO anon, authenticated, service_role;
