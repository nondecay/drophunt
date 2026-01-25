-- FORCE DELETE TARGET (SURGICAL OPERATION)
-- Hedef: Hunter_edm2 kullanıcısının silinmeyen yorumu.
-- ID: f389c9b3-e5fe-4890-840d-303e6bff8aea

DO $$
DECLARE
    target_id TEXT := 'f389c9b3-e5fe-4890-840d-303e6bff8aea'; 
    row_count INT;
BEGIN
    RAISE NOTICE '--- OPERASYON BASLIYOR ---';
    RAISE NOTICE 'Hedef ID: %', target_id;

    -- 1. Var mı kontrol et
    IF NOT EXISTS (SELECT 1 FROM public.comments WHERE id = target_id) THEN
        RAISE NOTICE 'HATA: Bu ID veritabaninda BULUNAMADI. Zaten silinmis olabilir mi?';
        RETURN;
    END IF;

    -- 2. SİL (Manuel Delete)
    DELETE FROM public.comments WHERE id = target_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;

    -- 3. Sonuç Raporu
    RAISE NOTICE 'Silme Komutu Calisti. Etkilenen Satir: %', row_count;

    -- 4. Sağlama (Gerçekten gitti mi?)
    IF EXISTS (SELECT 1 FROM public.comments WHERE id = target_id) THEN
        RAISE NOTICE 'KRITIK HATA: Satir hala yerinde duruyor! (Gizli Rollback/Kural)';
    ELSE
        RAISE NOTICE 'BASARI: Satir veritabanindan silindi.';
    END IF;

    RAISE NOTICE '--- OPERASYON BITTI ---';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PROGRAM COKTU: %', SQLERRM;
END $$;
