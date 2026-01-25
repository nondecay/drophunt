-- TEST DELETE MECHANISM V2 (VALID ID)
-- FK Hatasını düzelttik: Gerçek bir proje ID'si bulup onunla test edeceğiz.

DO $$
DECLARE
    valid_airdrop_id TEXT;
    test_comment_id TEXT;
    is_still_there BOOLEAN;
    wallet_check BOOLEAN;
BEGIN
    RAISE NOTICE '--- TEST START (V2) ---';

    -- 1. Check Wallet Permission
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO wallet_check;

    IF NOT wallet_check THEN
        RAISE NOTICE 'ERROR: Wallet verification failed (DB does not see you as Admin).';
        RETURN;
    END IF;

    -- 2. Find a REAL Airdrop ID (to avoid Foreign Key Error)
    SELECT id INTO valid_airdrop_id FROM public.airdrops LIMIT 1;
    
    IF valid_airdrop_id IS NULL THEN
        RAISE NOTICE 'ERROR: No airdrops found in database to attach comment to.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using Valid Airdrop ID: %', valid_airdrop_id;

    -- 3. Create Dummy Comment (Using Valid ID)
    INSERT INTO public.comments (
        id, "airdropId", address, username, content, "isApproved"
    ) VALUES (
        uuid_generate_v4()::text, 
        valid_airdrop_id, 
        '0x9126test', 
        'TestBot', 
        'DELETE ME TESTING', 
        true
    ) RETURNING id INTO test_comment_id;

    RAISE NOTICE 'Created Test Comment ID: %', test_comment_id;

    -- 4. Try Delete via Function
    BEGIN
        PERFORM public.delete_comment_safe(test_comment_id);
        RAISE NOTICE 'Function executed without error.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function CRASHED: %', SQLERRM;
    END;

    -- 5. Verify Existence
    SELECT EXISTS (SELECT 1 FROM public.comments WHERE id = test_comment_id) INTO is_still_there;

    IF is_still_there THEN
        RAISE NOTICE 'FAILURE: Comment STILL EXISTS (DB Trigger/Rule Issue).';
    ELSE
        RAISE NOTICE 'SUCCESS: Comment is GONE (Frontend ID Mismatch Issue).';
    END IF;

    RAISE NOTICE '--- TEST END ---';
END $$;
