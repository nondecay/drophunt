-- DIAGNOSE MISMATCH DEEP
-- Bu kod sorunu %100 ortaya çıkaracak.
-- Veritabanında senin Cüzdanın ile Oturumun arasındaki farkı gösterecek.

DO $$
DECLARE
    my_session_id text;
    wallet_record_id text;
    wallet_role text;
    session_record_role text;
BEGIN
    -- 1. Senin Şu Anki Oturum ID'n
    my_session_id := auth.uid()::text;
    
    -- 2. Cüzdan Adresinle Kayıtlı Olan ID ve Rol (Gerçek Admin Kaydı bu mu?)
    SELECT id::text, role || ' / ' || "memberStatus"
    INTO wallet_record_id, wallet_role
    FROM public.users 
    WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1';

    -- 3. Oturum ID'n ile Kayıtlı Olan Rol (Sistem seni ne görüyor?)
    SELECT role || ' / ' || "memberStatus"
    INTO session_record_role
    FROM public.users
    WHERE id::text = my_session_id;

    -- SONUÇLARI YAZDIR
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'DIAGNOSTIC REPORT';
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'My Session UUID  : %', COALESCE(my_session_id, 'NULL (Not Logged In)');
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Wallet Address   : 0x9126...';
    RAISE NOTICE 'Wallet Record ID : %', COALESCE(wallet_record_id, 'NOT FOUND');
    RAISE NOTICE 'Wallet Role      : %', COALESCE(wallet_role, 'N/A');
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Session DB Role  : %', COALESCE(session_record_role, 'NO RECORD FOUND FOR SESSION ID');
    RAISE NOTICE '==================================================';
    
    IF my_session_id != wallet_record_id THEN
        RAISE NOTICE 'CRITICAL ERROR FOUND: Mismatch!';
        RAISE NOTICE 'Your active session ID matches NO Admin record.';
        RAISE NOTICE 'The Admin record belongs to a DIFFERENT ID.';
    ELSE
        RAISE NOTICE 'IDs Match. Using Role: %', session_record_role;
    END IF;
END $$;
