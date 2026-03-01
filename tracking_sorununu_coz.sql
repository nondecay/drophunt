-- tracking_sorununu_coz.sql

-- 1. Tablodaki hatalı yetkilendirme (RLS) kurallarını SEÇİCİ olarak temizle
DROP POLICY IF EXISTS "Users_Update_Optimized" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Unified_Users_Update" ON public.users;
DROP POLICY IF EXISTS "Users_Update_Fix" ON public.users;

-- 2. "trackedProjectIds" sütununa sorunsuz bir şekilde değer girilebilmesi için tamamen GÜVENLİ kural:
CREATE POLICY "Users_Update_Fix" ON public.users 
FOR UPDATE 
USING (
  id = auth.uid()
);

-- (Eğer ekstra UPDATE engeli varsa diye authenticated rolüne users tablosundaki yetkilerini ver)
-- Burada spesifik sütun ismini BELİRTMEDEN (komple tablo üzerinden) güncelleme izni veriyoruz
-- ki tablo veya sütun ismi hatalarında "column does not exist" sorununa yakalanmayalım.
GRANT UPDATE ON public.users TO authenticated;
