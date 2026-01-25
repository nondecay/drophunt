-- TEST DELETE MECHANISM (ISOLATION CHECK)
-- Bu script sistemde "Hayalet" bir yorum oluşturup silmeyi dener.
-- Böylece sorunun veritabanında mı yoksa frontend'de mi olduğunu anlarız.

DO $$
DECLARE
    test_comment_id TEXT;
    is_still_there BOOLEAN;
    wallet_check BOOLEAN;
BEGIN
    RAISE NOTICE '--- TEST START ---';

    -- 1. Check Wallet Permission First
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    ) INTO wallet_check;

    IF NOT wallet_check THEN
        RAISE NOTICE 'ERROR: Wallet 0x9126... is NOT seen as Admin by the DB code.';
        RETURN;
    ELSE
        RAISE NOTICE 'SUCCESS: Wallet is recognized as Admin.';
    END IF;

    -- 2. Create Dummy Comment
    INSERT INTO public.comments (
        id, "airdropId", address, username, content, "isApproved"
    ) VALUES (
        uuid_generate_v4()::text, 
        'test-airdrop-id', 
        '0x9126test', 
        'TestBot', 
        'DELETE ME TESTING', 
        true
    ) RETURNING id INTO test_comment_id;

    RAISE NOTICE 'Created Test Comment ID: %', test_comment_id;

    -- 3. Try Delete via Function
    BEGIN
        PERFORM public.delete_comment_safe(test_comment_id);
        RAISE NOTICE 'Function executed without error.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function CRASHED: %', SQLERRM;
    END;

    -- 4. Verify Existence
    SELECT EXISTS (SELECT 1 FROM public.comments WHERE id = test_comment_id) INTO is_still_there;

    IF is_still_there THEN
        RAISE NOTICE 'FAILURE: Comment STILL EXISTS in database. (Transaction Rollback or Rule)';
    ELSE
        RAISE NOTICE 'SUCCESS: Comment is GONE from database.';
    END IF;

    RAISE NOTICE '--- TEST END ---';
END $$;
