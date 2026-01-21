-- ==============================================================================
-- BOOTSTRAP ADMIN SCRIPT
-- SQL Editor'de "auth.uid()" çalışmadığı için, bu scripti KENDİ ADRESİNLE çalıştırmalısın.
-- ==============================================================================

DO $$
DECLARE
    -- BURAYA KENDİ CÜZDAN ADRESİNİ YAZ (Harfi harfine aynı olsun)
    my_address text := '0x...ADRESİNİ_BURAYA_YAPIŞTIR...'; 
BEGIN
    -- Eğer adres girilmemişse uyarı ver
    IF my_address = '0x...ADRESİNİ_BURAYA_YAPIŞTIR...' THEN
        RAISE EXCEPTION 'Lütfen scriptin içindeki my_address kısmına kendi cüzdan adresinizi yazın!';
    END IF;

    -- 1. Kullanıcıyı Admin Yap
    UPDATE public.users
    SET 
        "memberStatus" = 'Admin',
        "role" = 'admin',
        "isAdmin" = true -- Generated değilse (ama generated ise hata verebilir, o yüzden alttaki exception block önemli)
    WHERE lower(address) = lower(my_address);

    -- Sonucu kontrol et
    IF NOT FOUND THEN
        RAISE NOTICE 'Bu adrese sahip kullanıcı bulunamadı! Cüzdan adresini kontrol et.';
    ELSE
        RAISE NOTICE 'Başarılı! % adresi artık Admin.', my_address;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Generated column hatası alırsak (isAdmin), sadece memberStatus güncelleyelim
    UPDATE public.users
    SET 
        "memberStatus" = 'Admin',
        "role" = 'admin'
    WHERE lower(address) = lower(my_address);
    
    RAISE NOTICE 'Başarılı! (Generate column atlandı) % adresi artık Admin ve RLS kurallarını geçebilir.', my_address;
END $$;
