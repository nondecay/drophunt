-- 1. ADIM: "is_admin" Fonksiyonlarındaki Performans Hatalarını ve "select auth.uid()" uyarılarını tamir edelim.
-- "select auth.uid()" kullanımı RLS uyarılarını kökünden çözecektir.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (SELECT auth.uid()) AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. ADIM: Guides tablosundaki BÜTÜN eski kural ve politikaları tamamen SİLELİM
ALTER TABLE public.guides DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides are public" ON public.guides;
DROP POLICY IF EXISTS "Authenticated users can submit guides" ON public.guides;
DROP POLICY IF EXISTS "Admins can manage guides" ON public.guides;
DROP POLICY IF EXISTS "Authors can update their guides" ON public.guides;
DROP POLICY IF EXISTS "Users can submit guides" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Delete" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Insert" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Select" ON public.guides;
DROP POLICY IF EXISTS "Strict_Guides_Update" ON public.guides;

-- 3. ADIM: GUIDES TABLOSU İÇİN TERTEMİZ RLS KURALLARINI EKLİYORUZ (Asla "0 satır" güncellemesi yaşatmaz)
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Okuma (SELECT): Herkese açık
CREATE POLICY "Guides SELECT"
ON public.guides FOR SELECT USING (true);

-- Ekleme (INSERT): Sadece sisteme bağlı olan üyeler
CREATE POLICY "Guides INSERT"
ON public.guides FOR INSERT WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
);

-- Güncelleme (UPDATE): Adminler VEYA Rehberin Yazarı
CREATE POLICY "Guides UPDATE"
ON public.guides FOR UPDATE 
USING (
  public.is_admin() OR author = (SELECT username FROM public.users WHERE id = (SELECT auth.uid()))
);

-- Silme (DELETE): Sadece Admin
CREATE POLICY "Guides DELETE"
ON public.guides FOR DELETE USING (
  public.is_admin()
);


-- 4. ADIM: GARANTİ ÇÖZÜM
-- Admin hesabınız veritabanında doğru role atanmamış olabilir (sorguda no raw error almıştınız). 
-- O yüzden kendi cüzdan adresinizle kendinizi "Süper Admin" yapın:
-- DİKKAT: 'cüzdan_adresiniz_buraya' yazan yere metamask adresinizi yazın!!!

-- UPDATE public.users SET role = 'admin', "memberStatus" = 'Super Admin' WHERE address = 'cüzdan_adresiniz_buraya';

-- ^ (Baştaki -- işaretlerini kaldırıp adresinizi girerek çalıştırırsanız sizi sistemin tanrısı yapar ve RLS engeli asla yaşamazsınız)
