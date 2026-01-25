-- FIX: MISSING ADMIN FUNCTION & RPC UPDATE

-- 1. Re-create the is_admin_safe function (STABLE for RLS performance)
CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to read all users
SET search_path = public
STABLE
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = user_id 
        AND (
            role = 'admin' 
            OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator')
        )
    ) INTO is_admin;
    
    RETURN COALESCE(is_admin, false);
END;
$$;

-- 2. Re-create the approve_comment RPC with specific type casting
CREATE OR REPLACE FUNCTION public.approve_comment(target_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_airdrop_id UUID;
    new_rating NUMERIC;
    caller_is_admin BOOLEAN;
BEGIN
    -- Security Check
    IF public.is_admin_safe(auth.uid()) IS NOT TRUE THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Update Comment
    UPDATE public.comments
    SET is_approved = true
    WHERE id = target_comment_id
    RETURNING "airdropId" INTO target_airdrop_id;

    IF target_airdrop_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found.';
    END IF;

    -- Recalculate Rating
    SELECT COALESCE(AVG(rating), 0)
    INTO new_rating
    FROM public.comments
    WHERE "airdropId" = target_airdrop_id
    AND is_approved = true;

    -- Update Project
    UPDATE public.airdrops
    SET rating = new_rating
    WHERE id = target_airdrop_id;
END;
$$;
