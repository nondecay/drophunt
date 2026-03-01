-- GERÇEK BİR TEST YAPALIM
-- Sorunun React (Frontend) objesinden mi yoksa Supabase RLS'ten mi kaynaklandığını %100 netleştirmeliyiz.

-- 1. Bu kodu Supabase SQL Editor'de çalıştırın.
-- Kendi başına HERHANGİ bir onaylanmamış rehberi bulup SADECE is_approved durumunu TRUE yapar.
-- DİKKAT: Cüzdan adresinize veya yetkinize bakmaz, direkt veritabanı komutudur, kesin çalışmalıdır.

UPDATE public.guides 
SET is_approved = true 
WHERE id = (SELECT id FROM public.guides WHERE is_approved = false LIMIT 1)
RETURNING *;

-- 2. Eğer bu sorguyu çalıştırdığınızda alt pencerede bir SATIR (Row) görüyorsanız ve hata vermiyorsa:
-- DB kısmında her şey SAĞLAM demektir. Sorun React tarafında gönderilen Objenin içeriğindedir (g.title vb.). 
-- Frontend kodunuza tam olarak bu yüzden müdahale ettim ("title" boşken error tetiklememesi için Payload güncelledim).

-- 3. Frontend tarafını kaydettim. Eğer bu SQL çalışıyorsa lütfen siteye dönüp Admin Panelinden sayfayı "Ctrl + F5" (Hard Refresh) ile yenileyin ve onaylamayı tekrar deneyin!
