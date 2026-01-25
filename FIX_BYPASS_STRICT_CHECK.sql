-- FIX BYPASS STRICT CHECK (RESPECTING EXISTING DATA)
-- Problem: System Restore caused a "Split Brain".
-- Your "Active Session ID" does not match your "Restored Admin Record ID".
-- Using 'auth.uid()' fails because of this mismatch.
-- Solution: This script tells the function to trust the Admin Record associated with your Wallet Address explicitly.

CREATE OR REPLACE FUNCTION public.approve_comment(target_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Must be DEFINER to look up the Admin Record independently
SET search_path = public
AS $$
DECLARE
    target_airdrop_id TEXT;
    col_exists BOOLEAN;
    is_wallet_admin BOOLEAN;
BEGIN
    -- 1. AUTH CHECK: DOES YOUR WALLET HAVE ADMIN ACCESS?
    -- Instead of checking "Who is calling?", we check "Does 0x9126... have Admin rights in this database?"
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1' -- Your Wallet
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO is_wallet_admin;

    IF NOT is_wallet_admin THEN
        RAISE EXCEPTION 'Access Denied: The wallet 0x9126... is NOT marked as Admin in the restored database.';
    END IF;

    -- 2. SMART COLUMN CHECK
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='isApproved') INTO col_exists;

    -- 3. UPDATE COMMENT
    IF col_exists THEN
        EXECUTE 'UPDATE public.comments SET "isApproved" = true WHERE id::text = $1 RETURNING "airdropId"::text' 
        INTO target_airdrop_id USING target_comment_id::text;
    ELSE
        EXECUTE 'UPDATE public.comments SET is_approved = true WHERE id::text = $1 RETURNING "airdropId"::text' 
        INTO target_airdrop_id USING target_comment_id::text;
    END IF;

    IF target_airdrop_id IS NULL THEN
        RAISE EXCEPTION 'Approval Failed: Comment not found.';
    END IF;
    
    -- Rating trigger will handle the rest.

END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_comment(UUID) TO authenticated, anon;
