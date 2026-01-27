-- FIX PERSISTENCE MASTER (FINAL CLEANUP)
-- Addresses:
-- 1. "Multiple Permissive Policies" on Guides (Explicitly drops duplicates)
-- 2. "Guides Reappearing" (Standardizes column)
-- 3. "Permissions Failed" (Case-insensitive Admin check)

-- 1. FIX GUIDES STANDARD
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guides' AND column_name='is_approved') THEN
        ALTER TABLE public.guides ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guides' AND column_name='isApproved') THEN
        UPDATE public.guides SET is_approved = "isApproved" WHERE "isApproved" IS NOT NULL;
    END IF;
END $$;

-- 2. FIX ADMIN CHECK (Secure & Optimized)
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (select auth.uid()) 
    AND (
        role = 'admin' 
        OR 
        "memberStatus" ILIKE '%admin%' 
        OR
        "memberStatus" ILIKE 'moderator'
    )
  );
END;
$$;

-- 3. CLEANUP ALL GUIDES POLICIES (Explicit Drop of Conflicts)
-- Dropping policies reported in your error log:
DROP POLICY IF EXISTS "Admin_Delete_Guides" ON public.guides;
DROP POLICY IF EXISTS "Admin_Insert_Guides" ON public.guides;
DROP POLICY IF EXISTS "Public_Read_Guides" ON public.guides;
DROP POLICY IF EXISTS "Admin_Update_Guides" ON public.guides;
-- Dropping other potential variations:
DROP POLICY IF EXISTS "Guides are public" ON public.guides;
DROP POLICY IF EXISTS "Users can submit guides" ON public.guides;
DROP POLICY IF EXISTS "Admins can manage guides" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Select" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Insert" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Update" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Delete" ON public.guides;

-- 4. RE-APPLY STRICT POLICIES (Optimized)

-- Select (Public)
CREATE POLICY "Strict_Guides_Select" ON public.guides FOR SELECT USING (true);

-- Insert (Auth)
CREATE POLICY "Strict_Guides_Insert" ON public.guides FOR INSERT WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Update (Admin OR Owner)
CREATE POLICY "Strict_Guides_Update" ON public.guides FOR UPDATE USING (
    (select public.is_admin_check())
    OR
    author = (
        SELECT username FROM public.users WHERE id = (select auth.uid())
    )
); 

-- Delete (Admin)
CREATE POLICY "Strict_Guides_Delete" ON public.guides FOR DELETE USING (
    (select public.is_admin_check())
);

-- 5. RE-FRESH CACHE
NOTIFY pgrst, 'reload schema';
