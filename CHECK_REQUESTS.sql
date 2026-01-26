-- CHECK REQUESTS CONTENT
-- airrop_requests tablosunda veri var mı kontrol edelim.

SELECT count(*) as total_requests FROM public.airdrop_requests;

SELECT * FROM public.airdrop_requests LIMIT 5;
