-- FIND PENDING COMMENTS
-- Onay bekleyen yorumları listeler. Test için bir ID alacağız.

SELECT id, substr(content, 1, 30) as short_content, username, "isApproved", "createdAt"
FROM public.comments
WHERE "isApproved" = false
ORDER BY "createdAt" DESC
LIMIT 5;
