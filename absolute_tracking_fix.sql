-- absolute_tracking_fix.sql

BEGIN;

-- 1. Tablodaki geçersiz ve sorunlu olan tüm UPDATE yetkilerini temizle
DROP POLICY IF EXISTS "Users_Update_Optimized" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Unified_Users_Update" ON public.users;
DROP POLICY IF EXISTS "Users_Update_Fix" ON public.users;
DROP POLICY IF EXISTS "Users_Update_Self" ON public.users;

-- 2. Özel Auth (SIWE/Cüzdan) yapınıza TAM UYGUN ve garantili RLS Update kuralını geri yükle
-- Bu kural, giriş yapan cüzdan adresi ile tablodaki adresin eşleşmesini veya uid'nin eşleşmesini kontrol eder.
CREATE POLICY "Users_Update_Self" ON public.users 
FOR UPDATE 
USING (
    id::text IN (
        SELECT id::text FROM public.users 
        WHERE lower("address") = lower(public.get_auth_address())
    )
    OR id::text = public.get_uid()
    OR auth.uid() = id
);

-- 3. Hata almamak için tüm yetkilendirilmiş (authenticated) kullanıcıların tabloyu update etmesine izin ver.
-- (RLS kuralları zaten bu izni güvenli bir şekilde filtreleyecektir, bu yüzden bu GÜVENLİDİR)
GRANT UPDATE ON public.users TO authenticated;
GRANT UPDATE ON public.users TO anon; -- Fallback for custom JWTs

COMMIT;
