-- ULTIMATE RESTORE SCRIPT
-- Executes a complete reset of permissions to fix "Infinite Recursion" and "Access Denied" errors.

-- 1. UNLOCK USERS TABLE (Fixes Login & Site Loading)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users to be safe
DROP POLICY IF EXISTS "Public_Read_Users" ON public.users;
DROP POLICY IF EXISTS "Allow All Select" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins_Update_Users" ON public.users;
-- (Add more drops if you have custom names, but strict drops above help)

-- ALLOW EVERYONE TO READ USERS (Breaks recursion loops for is_admin_safe)
CREATE POLICY "Public_Read_Users_Emergency"
ON public.users
FOR SELECT
USING (true);

-- ALLOW USERS TO UPDATE THEMSELVES (Fixes Login/Verification)
CREATE POLICY "Self_Update_Users"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ALLOW INSERT (New Users)
CREATE POLICY "Self_Insert_Users"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);


-- 2. UNLOCK CONTENT (Airdrops, Comments)
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Read_Airdrops" ON public.airdrops;
CREATE POLICY "Public_Read_Airdrops" ON public.airdrops FOR SELECT USING (true);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Read_Comments" ON public.comments;
CREATE POLICY "Public_Read_Comments" ON public.comments FOR SELECT USING (true);


-- 3. FIX ADMIN FUNCTION (Recursion Safe)
-- We use SECURITY DEFINER to ensure it runs as system, not user
CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple check, returning false if user not found, NO ERRORS
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false; -- Never break the site
END;
$$;

-- Overload for current user
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.is_admin_safe(auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_safe(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated, anon;


-- 4. FIX COMMENT APPROVAL (RPC)
CREATE OR REPLACE FUNCTION public.approve_comment(target_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_airdrop_id UUID;
    new_rating NUMERIC;
BEGIN
    -- Check Admin
    IF NOT public.is_admin_safe(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Update
    UPDATE public.comments
    SET is_approved = true
    WHERE id = target_comment_id
    RETURNING "airdropId" INTO target_airdrop_id;

    IF target_airdrop_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    -- Recalculate
    SELECT COALESCE(AVG(rating), 0) INTO new_rating
    FROM public.comments
    WHERE "airdropId" = target_airdrop_id AND is_approved = true;

    UPDATE public.airdrops SET rating = new_rating WHERE id = target_airdrop_id;
END;
$$;
