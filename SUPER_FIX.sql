-- 1. ADIM: RLS (Güvenlik) Yetki Sorununu Çözme
-- Sadece "role = 'admin'" olanlar değil, memberStatus = 'Admin' veya 'Super Admin' olanlar da yetkili sayılsın.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. ADIM: Sütun Karmaşasını Temizleme (isApproved ve is_approved birleştirme)
-- Yorumlar ve Rehberler tablosundaki çift sütunları temizleyip, isApproved verilerini is_approved sütununa aktarıyoruz.
DO $$ 
BEGIN 
    -- Comments Tablosu
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='isApproved') THEN
        UPDATE public.comments SET is_approved = "isApproved" WHERE "isApproved" IS NOT NULL;
        ALTER TABLE public.comments DROP COLUMN "isApproved";
    END IF;

    -- Guides Tablosu
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guides' AND column_name='isApproved') THEN
        UPDATE public.guides SET is_approved = "isApproved" WHERE "isApproved" IS NOT NULL;
        ALTER TABLE public.guides DROP COLUMN "isApproved";
    END IF;
END $$;

-- 3. ADIM: Yıldızlama (Rating) Sistemini Onarma ve Çift Tetikleyicileri (Trigger) Temizleme
-- Sistemde aynı isimde oluşmuş tüm trigger'ları önce siliyoruz ki karmaşa bitsin.
DROP TRIGGER IF EXISTS trigger_update_rating ON comments;

-- Oy sayısını (voteCount) ve ortalamayı (rating) alan ana fonksiyonumuz
CREATE OR REPLACE FUNCTION update_project_rating() RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    v_count INTEGER;
    v_project_id TEXT;
BEGIN
    -- Hangi projeyi güncellediğimizi bulalım
    IF (TG_OP = 'DELETE') THEN
        v_project_id := OLD."airdropId";
    ELSE
        v_project_id := NEW."airdropId";
    END IF;

    -- YALNIZCA ONAYLANMIŞ (is_approved = true) yorumların puanlarını ve sayısını hesapla
    SELECT COALESCE(AVG(rating), 0), COUNT(rating)
    INTO avg_rating, v_count
    FROM comments
    WHERE "airdropId" = v_project_id AND rating > 0 AND is_approved = true;

    -- Airdrops tablosundaki rating ve voteCount değerlerini güncelle
    UPDATE airdrops
    SET rating = avg_rating,
        "voteCount" = v_count
    WHERE id = v_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sadece tek ve sağlam bir tetikleyici oluşturuyoruz
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_project_rating();

-- 4. ADIM: Geçmiş Verileri Eşitleme (Zorunlu Değil ama anında sonuç görmek için)
-- Şu ana kadar girilmiş ve onaylanmış yorumların yıldız sayılarını airdrops tablosuna hemen yazar.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM airdrops LOOP
        UPDATE airdrops a
        SET rating = COALESCE((SELECT AVG(rating) FROM comments c WHERE c."airdropId" = a.id AND c.rating > 0 AND c.is_approved = true), 0),
            "voteCount" = COALESCE((SELECT COUNT(rating) FROM comments c WHERE c."airdropId" = a.id AND c.rating > 0 AND c.is_approved = true), 0)
        WHERE id = r.id;
    END LOOP;
END $$;
