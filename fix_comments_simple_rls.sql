-- FIX COMMENTS RLS SIMPLE (NO FUNCTION)
-- Bypasses the helper function and checks the users table directly in the policy.
-- This is often more reliable if there are context issues with functions.

-- 1. DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Strict_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Delete" ON public.comments;

-- 2. CREATE DIRECT POLICIES

-- UPDATE: Bütün yetki kontrolü policy içinde
CREATE POLICY "Simple_Comments_Update" ON public.comments FOR UPDATE USING (
    -- Admin Check (Direct Subquery)
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND "memberStatus" ILIKE '%admin%' -- Super Admin, Admin, etc.
    )
    OR
    -- Owner Check
    address = (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- DELETE: Bütün yetki kontrolü policy içinde
CREATE POLICY "Simple_Comments_Delete" ON public.comments FOR DELETE USING (
    -- Admin Check
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND "memberStatus" ILIKE '%admin%'
    )
    OR
    -- Owner Check
    address = (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- 3. RELOAD
NOTIFY pgrst, 'reload schema';
