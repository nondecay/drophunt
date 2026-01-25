-- FIX COMMENT DELETION (SAME LOGIC)
-- The "Delete" button fails for the same reason "Approve" did: The System ID doesn't match the Admin Record.
-- We fix this by creating a secure "Delete Function" that checks your Wallet Address directly.

CREATE OR REPLACE FUNCTION public.delete_comment(target_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public
AS $$
DECLARE
    is_wallet_admin BOOLEAN;
BEGIN
    -- 1. AUTH CHECK: DOES YOUR WALLET HAVE ADMIN ACCESS?
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1' -- Your Wallet
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO is_wallet_admin;

    IF NOT is_wallet_admin THEN
        RAISE EXCEPTION 'Access Denied: Wallet verification failed.';
    END IF;

    -- 2. DELETE THE COMMENT
    DELETE FROM public.comments 
    WHERE id::text = target_comment_id::text; -- Safe Text Comparison

END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_comment(UUID) TO authenticated, anon;
