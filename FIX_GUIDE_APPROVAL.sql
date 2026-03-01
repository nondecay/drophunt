-- SORUNUN KAYNAĞI BULUNDU: Guides tablosunun RLS politikaları "is_admin()" değil, "is_admin_check()" kullanıyor!

-- 1. "is_admin_check()" fonksiyonunu, hem "role = 'admin'" olanları hem de "memberStatus" değeri 'Admin' veya 'Super Admin' olanları kapsayacak şekilde güncelliyoruz.
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sitenizin tamamen kusursuz çalışması için, her ihtimale karşı "is_admin()" fonksiyonunu da aynı şekilde bırakıyoruz.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
