-- SIMULATE APPROVE CLICK (DEBUG)
-- Bu kod, yeni yazdığımız "approve_comment_safe" fonksiyonunu test eder.
-- Hedef ID: f7f5ab22-cc50-4d0f-8511-7df9ae14ece2 (Hunter_edm2)

DO $$
DECLARE
    target_id TEXT := 'f7f5ab22-cc50-4d0f-8511-7df9ae14ece2';
BEGIN
    RAISE NOTICE '--- ONAYLAMA SIMULASYONU BASLIYOR ---';
    
    PERFORM public.approve_comment_safe(target_id);
    
    RAISE NOTICE 'ISLEM BASARILI: Fonksiyon hata vermeden calisti.';
    RAISE NOTICE 'Lutfen kontrol edin: isApproved = true oldu mu?';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'HATA OLUSTU: %', SQLERRM;
END $$;
