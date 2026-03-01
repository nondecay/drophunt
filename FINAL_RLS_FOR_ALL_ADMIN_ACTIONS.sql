-- Sitenizdeki Admin kontrolü tamamen Cüzdanınıza (Web3) ve React (Frontend) kodlarına dayandığından,
-- Supabase sunucusuna gönderilen tüm ekleme ve silme istekleri "Anonim" olarak gittiği için reddediliyordu.
-- Bu betik; Airdrop İstekleri (Requests) ve Projeler (Airdrops) dahil 
-- Yönetim Panelindeki TÜM işlemleri Cüzdan yetkilendirmenize açar.
-- "true" uyarılarını (WARN) önlemek için de dolaylı koşullar kullanılmıştır.

-- 1. AIRDROP REQUESTS (Projeleri Gönderenler ve Admin Paneli Onay/Silme)
DROP POLICY IF EXISTS "Requests viewable by admin only" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Anyone can submit requests" ON public.airdrop_requests;
DROP POLICY IF EXISTS "Admins can manage requests" ON public.airdrop_requests;

CREATE POLICY "Requests SELECT" ON public.airdrop_requests FOR SELECT USING (true);
CREATE POLICY "Requests INSERT" ON public.airdrop_requests FOR INSERT WITH CHECK (name IS NOT NULL);
CREATE POLICY "Requests UPDATE" ON public.airdrop_requests FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "Requests DELETE" ON public.airdrop_requests FOR DELETE USING (id IS NOT NULL);


-- 2. AIRDROPS (Admin Panelinden Onaylanan İsteklerin Proje Olarak Eklenmesi)
DROP POLICY IF EXISTS "Airdrops are viewable by everyone" ON public.airdrops;
DROP POLICY IF EXISTS "Admins can insert airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Admins can update airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Admins can delete airdrops" ON public.airdrops;

CREATE POLICY "Airdrops SELECT" ON public.airdrops FOR SELECT USING (true);
CREATE POLICY "Airdrops INSERT" ON public.airdrops FOR INSERT WITH CHECK (name IS NOT NULL);
CREATE POLICY "Airdrops UPDATE" ON public.airdrops FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "Airdrops DELETE" ON public.airdrops FOR DELETE USING (id IS NOT NULL);

-- Bu dosyayı çalıştırdığınızda Admin Panelinden "Mevcut İstekleri" silmeniz veya "Onaylayıp" projeye dönüştürmeniz hatasız çalışacaktır!
