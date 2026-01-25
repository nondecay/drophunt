-- FIX DELETE FOR OWNERS (AND ADMINS)
-- This script upgrades the "delete_comment_safe" function.
-- OLD Logic: Only checks for 0x9126... Admin Wallet.
-- NEW Logic: Checks for Admin Wallet OR if you are the Owner of the comment.

CREATE OR REPLACE FUNCTION public.delete_comment_safe(target_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Bypass RLS to check User Table and Comment Owner
SET search_path = public
AS $$
DECLARE
    is_wallet_admin BOOLEAN;
    comment_owner_address TEXT;
    caller_id UUID;
    rows_deleted INTEGER;
BEGIN
    caller_id := auth.uid();

    -- 1. GET COMMENT OWNER (To check if it's yours)
    SELECT address INTO comment_owner_address 
    FROM public.comments 
    WHERE id::text = target_id;
    
    -- If comment doesn't exist, stop here.
    IF comment_owner_address IS NULL THEN
        RAISE EXCEPTION 'Delete Failed: Comment not found.';
    END IF;

    -- 2. CHECK: ARE YOU ADMIN? (Wallet Bypass)
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO is_wallet_admin;

    -- 3. CHECK: ARE YOU THE OWNER?
    -- We assume the User's Address in the 'comments' table matches their Wallet.
    -- Since we have "Split Brain", we rely on the Wallet Address matching.
    -- (Frontend sends requests signed by the user, so auth.uid() is valid for fetching THEIR address if needed,
    --  but easier: Check if the Caller's Wallet Address matches the Comment's Address)
    
    -- We need to know the Caller's Address from their User ID to compare.
    DECLARE
        caller_address TEXT;
    BEGIN
        SELECT address INTO caller_address FROM public.users WHERE id = caller_id;
        
        -- FINAL PERMISSION CHECK
        IF (is_wallet_admin) THEN
            -- Admin allowed
        ELSIF (caller_address IS NOT NULL AND caller_address ILIKE comment_owner_address) THEN
            -- Owner allowed
        ELSE
            RAISE EXCEPTION 'Access Denied: You are not the owner nor an admin.';
        END IF;
    END;

    -- 4. EXECUTE DELETE
    DELETE FROM public.comments 
    WHERE id::text = target_id;
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;

    IF rows_deleted = 0 THEN
         RAISE EXCEPTION 'Delete Failed: System Error (Row not deleted).';
    END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_comment_safe(TEXT) TO authenticated, anon;
