-- Hatanın nedenini bulmak için manuel bir UPDATE (Güncelleme) tetikleyelim.
-- Lütfen `your_wallet_address_here` yazan yeri kendi admin cüzdan adresinizle değiştirin.

DO $$ 
DECLARE 
    dummy_guide_id TEXT;
BEGIN
    -- İlk sıradaki test edeceğimiz rehberin ID'sini al
    SELECT id INTO dummy_guide_id FROM guides LIMIT 1;

    -- Eğer cüzdanınızın rolü veritabanında test edilemiyorsa hatayı görmek için SET auth.uid() gibi geçici session'lar denenebilir ama 
    -- en basiti o anki bağlı role ve UID'ye bakmaktır.
    
    -- LÜTFEN ASIL SORGULAYACAĞINIZ KISIM BURASIDIR: Mümkünse SQL Editor'ün sağ alt veya üst ayarlarından "Authenticated" veya cüzdan adresinize uygun giriş yapmış olduğunuza emin olun.
    -- Supabase admin tarafında çalıştırdığınız için RLS normalde baypas (Bypass) edilebilir.
    -- Eğer RLS'den şüpheleniyorsak, Guides RLS ilkelerini "sadece adminler değil herkes güncelleyebilir" yaparak test edebiliriz:
END $$;

-- 1. TEST ADIMI: RLS'yi (Güvenlik Kalkanını) geçici olarak tamamen devre dışı bırakalım.
ALTER TABLE public.guides DISABLE ROW LEVEL SECURITY;

-- 2. Eğer DISABLE ROW LEVEL SECURITY sonrasında "Admin Panelindeki Onayla Butonu" çalışırsa:
-- Demek ki sorun %100 oranında Supabase'in sizin cüzdan adresinizi "istek yaparken" doğru tanıyamamasıdır. (React tarafındaki Authentication JWT token eksikliği veya rol uyuşmazlığı)
