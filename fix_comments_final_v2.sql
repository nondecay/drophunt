-- FIX COMMENTS RLS FINAL V2 (ADD MODERATOR)
-- Previous simple script failed because it didn't include 'Moderator'.
-- This version adds explicit support for Moderators.

-- 1. DROP ALL VARIATIONS to be safe
DROP POLICY IF EXISTS "Strict_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Delete" ON public.comments;
DROP POLICY IF EXISTS "Simple_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Simple_Comments_Delete" ON public.comments;

-- 2. CREATE DIRECT POLICIES (Now including Moderator)

-- UPDATE: Bütün yetki kontrolü policy içinde (Admin + Moderator)
CREATE POLICY "Strict_Comments_Update" ON public.comments FOR UPDATE USING (
    -- Admin & Moderator Check (Direct Subquery)
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND (
            "memberStatus" ILIKE '%admin%'   -- Matches 'Admin', 'Super Admin'
            OR
            "memberStatus" ILIKE 'moderator' -- Matches 'Moderator'
        )
    )
    OR
    -- Owner Check
    address = (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- DELETE: Bütün yetki kontrolü policy içinde (Admin + Moderator)
CREATE POLICY "Strict_Comments_Delete" ON public.comments FOR DELETE USING (
    -- Admin & Moderator Check
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND (
            "memberStatus" ILIKE '%admin%'
            OR
            "memberStatus" ILIKE 'moderator'
        )
    )
    OR
    -- Owner Check
    address = (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- 3. RELOAD
NOTIFY pgrst, 'reload schema';
