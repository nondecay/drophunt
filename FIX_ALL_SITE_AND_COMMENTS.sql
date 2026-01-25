-- SUPER FIX: RESTORE SITE & FIX COMMENTS
-- RUN THIS FILE IN SUPABASE SQL EDITOR TO FIX EVERYTHING

-- PART 1: RESTORE SİTE ACCESS (White Screen Fix)
-- Unlocks the users table so the site can load profiles.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Read_Users" ON public.users;
CREATE POLICY "Public_Read_Users" ON public.users FOR SELECT USING (true);

-- Unlocks airdrops/comments just in case
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Read_Airdrops" ON public.airdrops;
CREATE POLICY "Public_Read_Airdrops" ON public.airdrops FOR SELECT USING (true);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Read_Comments" ON public.comments;
CREATE POLICY "Public_Read_Comments" ON public.comments FOR SELECT USING (true);


-- PART 2: FIX 'FUNCTION DOES NOT EXIST' ERROR
-- We define BOTH versions of the admin check to be 100% safe.
-- We do NOT use the 'email' column since it doesn't exist.

-- Version A: With Argument (UUID)
CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
$$;

-- Version B: No Argument (Uses Current User)
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin_safe(auth.uid());
$$;

-- Grant permissions so the API can find them
GRANT EXECUTE ON FUNCTION public.is_admin_safe(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated, anon;


-- PART 3: FIX COMMENT APPROVAL BUTTON (RPC)
-- Your frontend is currently trying to call this function. We must create it.
-- This function approves the comment AND updates the project rating automatically.

CREATE OR REPLACE FUNCTION public.approve_comment(target_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS for the update
SET search_path = public
AS $$
DECLARE
    target_airdrop_id UUID;
    new_rating NUMERIC;
BEGIN
    -- 1. Check Admin (Using our safe function)
    IF NOT public.is_admin_safe(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: You are not an admin.';
    END IF;

    -- 2. Approve the comment
    UPDATE public.comments
    SET is_approved = true
    WHERE id = target_comment_id
    RETURNING "airdropId" INTO target_airdrop_id;

    IF target_airdrop_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found.';
    END IF;

    -- 3. Recalculate Rating (Average of all approved comments)
    SELECT COALESCE(AVG(rating), 0)
    INTO new_rating
    FROM public.comments
    WHERE "airdropId" = target_airdrop_id
    AND is_approved = true;

    -- 4. Update Project Rating
    UPDATE public.airdrops
    SET rating = new_rating
    WHERE id = target_airdrop_id;
END;
$$;
