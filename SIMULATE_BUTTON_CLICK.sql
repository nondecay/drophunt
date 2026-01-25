-- SIMULATE BUTTON CLICK (DEBUG)
-- Bu kod, Admin Panelindeki "Sil" butonunun yaptığı işlemin AYNISINI yapar.
-- Amaç: Butona basınca arka planda çıkan gizli hatayı görmektir.

DO $$
DECLARE
    target_id TEXT := 'f389c9b3-e5fe-4890-840d-303e6bff8aea';
BEGIN
    RAISE NOTICE '--- BUTON SIMULASYONU BASLIYOR ---';
    
    -- Admin Panelinin çağırdığı fonksiyonu çağırıyoruz:
    PERFORM public.delete_comment_safe(target_id);
    
    RAISE NOTICE 'ISLEM BASARILI: Fonksiyon hata vermeden calisti.';
    RAISE NOTICE 'Eger yorum hala duruyorsa, Veritabani transaction commit etmiyor demektir.';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Butona basinca olusan HATA: %', SQLERRM;
END $$;
