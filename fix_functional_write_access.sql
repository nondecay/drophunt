BEGIN;

-- ==============================================================================
-- 1. TRACKING (TODOS) & CLAIMS FIXED FOR WRITE
-- Sorun: Frontend "userId" olarak ProfileID gönderiyor, ama biz AuthID bekliyorduk.
-- Çözüm: "Yazdığın userId, senin cüzdan adresine kayıtlı olan User ID mi?" kontrolü.
-- ==============================================================================

DROP POLICY IF EXISTS "Owner_Insert_Todos" ON public.todos;
CREATE POLICY "Owner_Insert_Todos" ON public.todos FOR INSERT 
WITH CHECK (
    "userId"::text IN (
        SELECT id::text FROM public.users 
        WHERE lower("address") = lower(public.get_auth_address())
    )
    OR "userId"::text = public.get_uid() -- Fallback
);

DROP POLICY IF EXISTS "Owner_Update_Todos" ON public.todos;
CREATE POLICY "Owner_Update_Todos" ON public.todos FOR UPDATE 
USING (
    "userId"::text IN (
        SELECT id::text FROM public.users 
        WHERE lower("address") = lower(public.get_auth_address())
    )
    OR "userId"::text = public.get_uid()
);

-- User Claims için de aynısı
DROP POLICY IF EXISTS "Owner_Insert_Claims" ON public.user_claims;
CREATE POLICY "Owner_Insert_Claims" ON public.user_claims FOR INSERT 
WITH CHECK (
    "userId"::text IN (
        SELECT id::text FROM public.users 
        WHERE lower("address") = lower(public.get_auth_address())
    )
    OR "userId"::text = public.get_uid()
);


-- ==============================================================================
-- 2. COMMENTS FIX (Yorum Sorunu)
-- Sorun: Yorum atarken address kontrolü katıydı.
-- ==============================================================================
DROP POLICY IF EXISTS "Owner_Insert_Comments" ON public.comments;
CREATE POLICY "Owner_Insert_Comments" ON public.comments FOR INSERT 
WITH CHECK (
    lower(address) = lower(public.get_auth_address())
);

DROP POLICY IF EXISTS "Owner_Update_Comments" ON public.comments;
CREATE POLICY "Owner_Update_Comments" ON public.comments FOR UPDATE 
USING (lower(address) = lower(public.get_auth_address()));

DROP POLICY IF EXISTS "Owner_Delete_Comments" ON public.comments;
CREATE POLICY "Owner_Delete_Comments" ON public.comments FOR DELETE 
USING (lower(address) = lower(public.get_auth_address()));


-- ==============================================================================
-- 3. USER PROFILE FIX (Kullanıcı Adı Değişmiyor)
-- Sorun: Users tablosunu update ederken ID mismatch yaşanıyor.
-- ==============================================================================
DROP POLICY IF EXISTS "Users_Update_Self" ON public.users;
CREATE POLICY "Users_Update_Self" ON public.users FOR UPDATE 
USING (
    id::text IN (
        SELECT id::text FROM public.users 
        WHERE lower("address") = lower(public.get_auth_address())
    )
    OR id::text = public.get_uid()
);


-- ==============================================================================
-- 4. MESSAGES TABLE FIX (Admin Mesaj Atamıyor)
-- Sorun: "messages" tablosunun RLS politikası yoktu ya da Admin'e kapalıydı.
-- ==============================================================================
-- Tablo isminin public.messages olduğundan emin olalım (grep sonucu doğruladı)
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin_Manage_Messages" ON public.messages;
CREATE POLICY "Admin_Manage_Messages" ON public.messages FOR ALL 
USING (public.admin_check_robust())
WITH CHECK (public.admin_check_robust());

-- Kullanıcılar mesajları okuyabilmeli (Kendi mesajları ise veya genel duyuru)
DROP POLICY IF EXISTS "User_Read_Messages" ON public.messages;
CREATE POLICY "User_Read_Messages" ON public.messages FOR SELECT 
USING (true); -- Şimdilik genel okuma izni (Broadcast)


-- ==============================================================================
-- 5. SURMIT PROJECT (AIRDROP REQUESTS)
-- Sorun: Proje gönderimi admin paneline düşmüyor (Insert reddediliyor).
-- ==============================================================================
DROP POLICY IF EXISTS "Public_Insert_Requests" ON public.airdrop_requests;
CREATE POLICY "Public_Insert_Requests" ON public.airdrop_requests FOR INSERT 
WITH CHECK (true); -- Herkes proje gönderebilir (form açık).

DROP POLICY IF EXISTS "Admin_Manage_Requests" ON public.airdrop_requests;
CREATE POLICY "Admin_Manage_Requests" ON public.airdrop_requests FOR ALL 
USING (public.admin_check_robust())
WITH CHECK (public.admin_check_robust());


-- ==============================================================================
-- 6. GUIDES FIX (Admin Guide Düzenleyemiyor)
-- ==============================================================================
DROP POLICY IF EXISTS "Admin_Manage_Guides" ON public.guides;
CREATE POLICY "Admin_Manage_Guides" ON public.guides FOR ALL 
USING (public.admin_check_robust())
WITH CHECK (public.admin_check_robust());

DROP POLICY IF EXISTS "Public_Read_Guides" ON public.guides;
CREATE POLICY "Public_Read_Guides" ON public.guides FOR SELECT 
USING (true);


COMMIT;
