-- DISABLE RATING TRIGGER (DIAGNOSTIC)
-- Bu script puan hesaplama tetikleyicisini GEÇİCİ OLARAK kapatır.
-- Eğer yorum şimdi silinebiliyorsa, suçlu tetikleyicidir.

ALTER TABLE public.comments DISABLE TRIGGER trigger_update_rating;

-- İleride tekrar açmak için:
-- ALTER TABLE public.comments ENABLE TRIGGER trigger_update_rating;
