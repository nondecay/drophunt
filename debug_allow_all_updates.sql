-- DEBUG: ALLOW ALL UPDATES (TEMPORARY)
-- This script removes strict checks to see if the User is simply "Not Admin" in the DB.
-- WARNING: This allows any logged-in user to approve comments.

DROP POLICY IF EXISTS "Strict_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Strict_Comments_Delete" ON public.comments;

CREATE POLICY "Debug_Allow_All_Update" ON public.comments FOR UPDATE USING (
    (select auth.role()) = 'authenticated'
);

CREATE POLICY "Debug_Allow_All_Delete" ON public.comments FOR DELETE USING (
    (select auth.role()) = 'authenticated'
);

NOTIFY pgrst, 'reload schema';
