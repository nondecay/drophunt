-- FIX: COMMENT APPROVAL PERSISTENCE
-- The frontend is likely sending 'is_approved' but the RLS or Column name might be tricky.
-- We ensure the column exists and the RLS allows admins to update it.

-- 1. Ensure Column Exists (and is standard snake_case)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- 2. Drop "CamelCase" column if it exists (Cleanup)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='isApproved') THEN
        -- Migrate data first
        UPDATE public.comments SET is_approved = "isApproved" WHERE "isApproved" IS NOT NULL;
        ALTER TABLE public.comments DROP COLUMN "isApproved";
    END IF;
END $$;

-- 3. RLS: Allow Admins to Update Comments
DROP POLICY IF EXISTS "Admins_Update_Comments" ON public.comments;

CREATE POLICY "Admins_Update_Comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (
    public.is_admin_safe(auth.uid()) = true
)
WITH CHECK (
    public.is_admin_safe(auth.uid()) = true
);
