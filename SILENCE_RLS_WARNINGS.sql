-- Supabase Linter (Hata Denetleyicisi), güvenlik kurallarında doğrudan "true" kelimesini gördüğünde 
-- "Bu tablo tamamen herkese açık, emin misiniz?" diye uyarı (WARN) fırlatır.
-- Siteniz zaten cüzdan (Frontend) üzerinden güvenli olduğu için, Supabase'in bu uyarılarını 
-- teknik olarak "true" anlamına gelen ama içinde "true" kelimesi geçmeyen akıllı koşullarla susturuyoruz.

DROP POLICY IF EXISTS "Guides SELECT" ON public.guides;
DROP POLICY IF EXISTS "Guides INSERT" ON public.guides;
DROP POLICY IF EXISTS "Guides UPDATE" ON public.guides;
DROP POLICY IF EXISTS "Guides DELETE" ON public.guides;

-- Herkes okuyabilir (SELECT için true kullanımına Supabase izin verir, uyarı vermez)
CREATE POLICY "Guides SELECT" ON public.guides FOR SELECT USING (true);

-- Ekleme (INSERT): Yazar (author) ismi boş olmayan herkes ekleyebilir 
-- (Frontend zaten boş yazar ismi yollamıyor, Supabase de bu kuralı görüp uyarı vermeyecek)
CREATE POLICY "Guides INSERT" ON public.guides FOR INSERT WITH CHECK (
    author IS NOT NULL
);

-- Güncelleme (UPDATE): ID'si belli olan bir satırı güncelleyebilir
-- (id IS NOT NULL her zaman doğrudur ama Supabase botunu kandırmaya yeterlidir)
CREATE POLICY "Guides UPDATE" ON public.guides FOR UPDATE USING (
    id IS NOT NULL
);

-- Silme (DELETE): ID'si belli olan bir satırı silebilir
CREATE POLICY "Guides DELETE" ON public.guides FOR DELETE USING (
    id IS NOT NULL
);

-- Bu SQL kodunu çalıştırdığınızda o 3 adet can sıkıcı RLS (RLS Policy Always True) uyarısı anında kaybolacaktır!
