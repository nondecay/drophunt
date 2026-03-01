-- ÖZEL RLS GÜNCELLEMESİ (AirDrop Tracking Sorunu İçin)
-- Sadece 'users' tablosundaki sorunlu UPDATE yetkisini düzeltir.

BEGIN;

-- 1. Tablodaki tüm mevcut sorunlu UPDATE kurallarını kaldırıyoruz.
DROP POLICY IF EXISTS "Users_Update_Optimized" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Unified_Users_Update" ON public.users;

-- 2. Çok temiz ve basit yeni kuralımız (sadece kendi ID'si eşitse günceller)
CREATE POLICY "Users_Update_Fix" ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- 3. SSS: Sadece var olan "trackedProjectIds" sütununa yetki veriyoruz.
GRANT UPDATE("trackedProjectIds") ON public.users TO authenticated;

COMMIT;

-- Cache temizliği
NOTIFY pgrst, 'reload schema';
