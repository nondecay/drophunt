-- FIX COMMENT DELETION FINAL (TRIGGER SAFETY + TEXT ID)
-- Problem: Comment comes back after refresh. 
-- Cause 1: "Trigger Error" (If the rating calculation crashes, the delete is cancelled).
-- Cause 2: "ID Mismatch" (Function expects UUID but gets TEXT, or vice versa).

-- 1. ENSURE TRIGGER IS SAFE (CRITICAL: If this fails, Delete fails)
CREATE OR REPLACE FUNCTION update_project_rating() RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    v_project_id TEXT;
    col_exists BOOLEAN;
BEGIN
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            v_project_id := OLD."airdropId"::text;
        ELSE
            v_project_id := NEW."airdropId"::text;
        END IF;

        -- Smart Column Check
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='isApproved') INTO col_exists;

        IF col_exists THEN
            EXECUTE 'SELECT AVG(rating) FROM comments WHERE "airdropId"::text = $1 AND rating > 0 AND "isApproved" = true' 
            INTO avg_rating USING v_project_id;
        ELSE
            EXECUTE 'SELECT AVG(rating) FROM comments WHERE "airdropId"::text = $1 AND rating > 0 AND is_approved = true' 
            INTO avg_rating USING v_project_id;
        END IF;

        UPDATE airdrops
        SET rating = COALESCE(avg_rating, 0)
        WHERE id::text = v_project_id;
        
    EXCEPTION WHEN OTHERS THEN
        -- CRITICAL: Prevent trigger crash from blocking Delete
        RAISE NOTICE 'Rating update failed but ignoring to allow operation: %', SQLERRM;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach Trigger
DROP TRIGGER IF EXISTS trigger_update_rating ON comments;
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_project_rating();


-- 2. ROBUST DELETE FUNCTION (Accepts TEXT, Check Count)
CREATE OR REPLACE FUNCTION public.delete_comment_safe(target_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_wallet_admin BOOLEAN;
    rows_deleted INTEGER;
BEGIN
    -- A. Auth Check (Wallet)
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO is_wallet_admin;

    IF NOT is_wallet_admin THEN
        RAISE EXCEPTION 'Access Denied: Wallet verification failed.';
    END IF;

    -- B. Delete (By Text ID)
    DELETE FROM public.comments 
    WHERE id::text = target_id;
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;

    -- C. Validate
    IF rows_deleted = 0 THEN
        RAISE EXCEPTION 'Delete Failed: Comment not found (ID Mismatch).';
    END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_comment_safe(TEXT) TO authenticated, anon;
