-- RPC: Approve Comment & Recalculate Rating
-- This bypasses RLS issues and ensures the rating is always in sync.

CREATE OR REPLACE FUNCTION public.approve_comment(target_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as database owner (bypasses RLS)
SET search_path = public
AS $$
DECLARE
    target_airdrop_id UUID;
    new_rating NUMERIC;
    caller_is_admin BOOLEAN;
BEGIN
    -- 1. Security Check: Ensure caller is Admin
    SELECT public.is_admin_safe(auth.uid()) INTO caller_is_admin;
    IF NOT caller_is_admin THEN
        RAISE EXCEPTION 'Access Denied: Only Admins can approve comments.';
    END IF;

    -- 2. Update the Comment
    UPDATE public.comments
    SET is_approved = true
    WHERE id = target_comment_id
    RETURNING "airdropId" INTO target_airdrop_id;

    IF target_airdrop_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found or Airdrop ID missing.';
    END IF;

    -- 3. Recalculate Average Rating for the Project
    -- We take all ALLOWED (approved) comments for this airdrop
    SELECT COALESCE(AVG(rating), 0)
    INTO new_rating
    FROM public.comments
    WHERE "airdropId" = target_airdrop_id
    AND is_approved = true;

    -- 4. Update the Airdrop/Project Table
    UPDATE public.airdrops
    SET rating = new_rating
    WHERE id = target_airdrop_id;

END;
$$;
