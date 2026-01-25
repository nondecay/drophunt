-- ENABLE TRIGGER AND LIST COMMENTS
-- 1. Trigger'ı geri açıyoruz (İsteğin üzerine)
ALTER TABLE public.comments ENABLE TRIGGER trigger_update_rating;

-- 2. Son 5 Yorumu Listele
-- Hangi yorumu silmeye çalıştığını görmek için son eklenenlere bakıyorum.
SELECT id, substr(content, 1, 30) as short_content, username, "isApproved", "createdAt"
FROM public.comments
ORDER BY "createdAtTimestamp" DESC
LIMIT 5;
