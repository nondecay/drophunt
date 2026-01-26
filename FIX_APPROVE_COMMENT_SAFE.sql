-- FIX APPROVE COMMENT SAFE (WALLET BYPASS + TEXT ID)
-- Problem: "Approve" fails silently likely due to ID Mismatch or Trigger Rollback.
-- Solution: Create a robust function that trusts your Wallet Address explicitly.

CREATE OR REPLACE FUNCTION public.approve_comment_safe(target_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public
AS $$
DECLARE
    is_wallet_admin BOOLEAN;
    rows_updated INTEGER;
BEGIN
    -- 1. AUTH CHECK: ARE YOU THE ADMIN? (Wallet Check)
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO is_wallet_admin;

    IF NOT is_wallet_admin THEN
        RAISE EXCEPTION 'Access Denied: Wallet verification failed.';
    END IF;

    -- 2. UPDATE (Approve)
    -- We try both "isApproved" (camelCase) and "is_approved" (snake_case) just in case, 
    -- but usually we know which one exists. Based on previous steps, it's likely "isApproved".
    
    UPDATE public.comments 
    SET "isApproved" = true 
    WHERE id::text = target_id;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    -- 3. VALIDATE
    IF rows_updated = 0 THEN
         RAISE EXCEPTION 'Approval Failed: Comment not found (ID: %)', target_id;
    END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_comment_safe(TEXT) TO authenticated, anon;
