-- CHECK MY ID (BASIT VERSİYON)
-- Bu sorguyu çalıştırınca altta bir tablo çıkacak. O tabloyu bana atabilir misin?
-- Bu tablo senin sisteme nasıl bağlı olduğunu gösterecek.

SELECT 
    -- 1. Şu anki Oturum Numaran (UUID)
    auth.uid() AS "SESSION_ID (Oturum)",

    -- 2. Sistemde bu numara ile kayıtlı biri var mı?
    (SELECT role FROM public.users WHERE id = auth.uid()) AS "ROLE_BY_SESSION (Oturumdaki Rol)",

    -- 3. Cüzdan adresi ile kayıtlı adminin numarası ne?
    (SELECT id FROM public.users WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1') AS "WALLET_ID (Gerçek Kayıt)",

    -- 4. Cüzdan adresi ile kayıtlı rol ne?
    (SELECT role FROM public.users WHERE address ILIKE '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1') AS "WALLET_ROLE (Gerçek Rol)"
;
