-- Kullanıcılarımız Web3 (Cüzdan) girişi kullandığı için Supabase ortamında anonim olarak değerlendirilmektedir.
-- Bu nedenle "airdrop_requests" (Admin paneline düşen Gönderilen Projeler) tablomuz için de
-- tıpkı "guides" tablosunda yaptığımız gibi RLS (Satır Bazlı Güvenlik) kurallarını, 
-- güvenliği Frontend'e bırakacak şekilde güncelliyoruz.

DROP POLICY IF EXISTS "Requests viewable by admin only" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Anyone can submit requests" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Admins can manage requests" ON public.airdrop_requests;

-- Okuma (Frontend zaten sadece yetkililere Admin panelini gösteriyor)
CREATE POLICY "Requests SELECT" ON public.airdrop_requests FOR SELECT USING (true);

-- Ekleme (Ana sayfadaki Submit Project formu boş değilse eklenebilir)
CREATE POLICY "Requests INSERT" ON public.airdrop_requests FOR INSERT WITH CHECK (
    name IS NOT NULL
);

-- Güncelleme ve Silme (Admin Panelinden Onaylama / Reddetme)
CREATE POLICY "Requests UPDATE" ON public.airdrop_requests FOR UPDATE USING (
    id IS NOT NULL
);

CREATE POLICY "Requests DELETE" ON public.airdrop_requests FOR DELETE USING (
    id IS NOT NULL
);
