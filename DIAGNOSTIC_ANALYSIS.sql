-- KESİN TEŞHİS SORGULARI (Hiçbir şeyi bozmaz, sadece röntgen çeker) 
-- Lütfen bu dosyayı Supabase SQL Editor'de çalıştırın ve alttaki 3 mesajı bana iletin.

DO $$ 
DECLARE
    v_admin_result BOOLEAN;
    v_trigger_count INTEGER;
    v_policy_count INTEGER;
BEGIN
    -- 1. Rolünüzün veritabanında gerçekten 'admin' olup olmadığını test edelim:
    -- (auth.uid() sadece bağlı bir oturum varsa çalışır, direkt SQL Editor'den çalıştırdığınız için sizin aktif oturumunuzu baz alır)
    v_admin_result := public.is_admin();
    
    -- 2. Guides tablosunda güncellemeyi EZEBİLECEK gizli bir Trigger var mı?
    SELECT count(*) INTO v_trigger_count FROM information_schema.triggers WHERE event_object_table = 'guides' AND event_manipulation = 'UPDATE';

    -- 3. Guides tablosundaki aktif policy sayısına bakalım:
    SELECT count(*) INTO v_policy_count FROM pg_policies WHERE tablename = 'guides';

    -- SONUÇLARI Hata Mesajı formatında ekrana yansıtıyoruz ki kolayca okuyun:
    RAISE NOTICE E'\n\n=== TEŞHİS RAPORU ===\n1. Veritabanı sizi Admin Görüyor Mu? : %\n2. Guides Güncelleme Tetikleyici Sayısı: %\n3. Guides Tablosu Policy Sayısı: %\n=====================\n\n', 
        v_admin_result, v_trigger_count, v_policy_count;
END $$;
