-- FIX REQUESTS RLS FINAL
-- Proje gönderme hatasını (RLS Policy) kesin olarak çözer.

-- 1. Tabloyu güvene al (RLS aç)
ALTER TABLE public.airdrop_requests ENABLE ROW LEVEL SECURITY;

-- 2. Eski/Hatalı polikaları temizle
DROP POLICY IF EXISTS "Public_Insert_Requests" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Allow_Insert_Requests" ON public.airdrop_requests;

-- 3. Yeni İzin: HERKES EKLEME YAPABİLSİN
-- (Anonim veya giriş yapmış fark etmez, istek gönderebilsinler)
CREATE POLICY "Public_Insert_Requests_Final"
ON public.airdrop_requests
FOR INSERT
WITH CHECK (true);

-- 4. Okuma İzni (Sadece Adminler veya Kendi ekleyenler değil, şimdilik admin paneli okusun diye geniş tutuyoruz veya sadece admin yapıyoruz)
-- AdminPanel.tsx yetkili okuma yapıyor ama biz yine de policy ekleyelim.
DROP POLICY IF EXISTS "Read_Requests" ON public.airdrop_requests;
CREATE POLICY "Read_Requests"
ON public.airdrop_requests
FOR SELECT
USING (true); -- Şimdilik okumayı da açalım ki admin panelinde sorun çıkmasın.

-- 5. Yetkileri Tazele
GRANT ALL ON public.airdrop_requests TO postgres;
GRANT ALL ON public.airdrop_requests TO anon;
GRANT ALL ON public.airdrop_requests TO authenticated;
GRANT ALL ON public.airdrop_requests TO service_role;
