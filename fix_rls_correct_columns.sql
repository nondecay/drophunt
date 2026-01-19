-- FIX RLS: Correct Columns & Types (UUID)
-- This script fixes the "new row violates row-level security policy" error by aligning SQL policies
-- with the actual schema columns ("userId") and using proper UUID comparisons.

-- ==============================================================================
-- 1. TODOS (Column: "userId" UUID)
-- ==============================================================================
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- DROP ALL potential old policies to ensure clean slate
DROP POLICY IF EXISTS "Public_All_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Select_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Insert_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Update_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Delete_Todos" ON public.todos;
DROP POLICY IF EXISTS "Allows all" ON public.todos;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;

-- SELECT: Users see their own todos, Admins see all
CREATE POLICY "Strict_Select_Todos" ON public.todos FOR SELECT USING (
    auth.uid() = "userId" 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- INSERT: Users can only insert rows where "userId" matches their own ID
CREATE POLICY "Strict_Insert_Todos" ON public.todos FOR INSERT WITH CHECK (
    auth.uid() = "userId"
);

-- UPDATE: Users update their own, Admins update any
CREATE POLICY "Strict_Update_Todos" ON public.todos FOR UPDATE USING (
    auth.uid() = "userId" 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- DELETE: Users delete their own, Admins delete any
CREATE POLICY "Strict_Delete_Todos" ON public.todos FOR DELETE USING (
    auth.uid() = "userId" 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


-- ==============================================================================
-- 2. USER_CLAIMS (Column: "userId" UUID)
-- ==============================================================================
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public_All_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Select_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Insert_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Update_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Delete_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Nuclear Allow All Claims" ON public.user_claims;

-- SELECT
CREATE POLICY "Strict_Select_Claims" ON public.user_claims FOR SELECT USING (
    auth.uid() = "userId"
);

-- INSERT
CREATE POLICY "Strict_Insert_Claims" ON public.user_claims FOR INSERT WITH CHECK (
    auth.uid() = "userId"
);

-- UPDATE
CREATE POLICY "Strict_Update_Claims" ON public.user_claims FOR UPDATE USING (
    auth.uid() = "userId"
);

-- DELETE
CREATE POLICY "Strict_Delete_Claims" ON public.user_claims FOR DELETE USING (
    auth.uid() = "userId"
);


-- ==============================================================================
-- 3. INBOX_MESSAGES (Column: "userId" UUID)
-- ==============================================================================
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public_All_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Repair_Inbox_Select" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Select_Inbox" ON public.inbox_messages;
DROP POLICY IF EXISTS "Strict_Insert_Inbox" ON public.inbox_messages;

-- SELECT: Users see their own
CREATE POLICY "Strict_Select_Inbox" ON public.inbox_messages FOR SELECT USING (
    auth.uid() = "userId"
);

-- INSERT: Only Admins (or system) can verify/insert messages for now
CREATE POLICY "Strict_Insert_Inbox" ON public.inbox_messages FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


-- ==============================================================================
-- 4. COMMENTS (Column: address TEXT) -> Special Case
-- ==============================================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public_All_Comments" ON public.comments;
DROP POLICY IF EXISTS "Strict_Select_Comments" ON public.comments;
DROP POLICY IF EXISTS "Strict_Insert_Comments" ON public.comments;
DROP POLICY IF EXISTS "Strict_Delete_Comments" ON public.comments;

-- SELECT: Public
CREATE POLICY "Strict_Select_Comments" ON public.comments FOR SELECT USING (true);

-- INSERT: Authenticated users can insert. 
-- We verify the 'address' in current user profile matches the comment address?
-- Or strictly rely on Auth? For simplicity, just Authenticated for now.
CREATE POLICY "Strict_Insert_Comments" ON public.comments FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- DELETE: Owner (by address lookup) or Admin
CREATE POLICY "Strict_Delete_Comments" ON public.comments FOR DELETE USING (
    address = (SELECT address FROM public.users WHERE id = auth.uid()) 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
