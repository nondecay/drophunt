-- Supabase'in "Onaylandı" mesajı verip işlemi MASA ALTINDAN SİLMESİNİN (0 satır) ana sebebini bulduk:
-- Siteye giriş yaptığınız anki oturum ID'niz (Auth UID) ile, users tablosundaki asıl "Admin" id'niz birbirinden kopmuş!
-- RLS kalkanını asla kapatmadan, RLS'in sizin cüzdan adresinizi doğrudan tanımasını sağlayan köprüyü inşa ediyoruz.

-- 1. ADIM: SİTEYE BAĞLANDIĞINIZ CÜZDAN ADRESİNİZİ AŞAĞIYA YAPIŞTIRIN:
UPDATE public.users 
SET role = 'admin', 
    "memberStatus" = 'Super Admin' 
WHERE lower(address) = lower('CÜZDAN_ADRESİNİZİ_BURAYA_YAPIŞTIRIN');


-- 2. ADIM: Güvenlik Duvarını (RLS) Sizin Cüzdanınızı Tanıyacak Şekilde Güçlendiriyoruz
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    session_address TEXT;
BEGIN
    -- Sadece id eşleşmesine bakma, eğer id eşleşmezse kullanıcının siteye girdiği cüzdan adresini (JWT'den) oku!
    session_address := lower(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'address');

    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE (id = auth.uid() OR lower(address) = session_address)
        AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ayrıca is_admin_check fonksiyonunun da aynısını yapmasını garanti ediyoruz
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
