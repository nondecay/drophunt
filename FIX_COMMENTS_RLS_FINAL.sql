-- FIX COMMENTS RLS FINAL
-- Yorum onaylama sorunu için kesin çözüm.

-- 1. Önce kafa karıştıran tüm eski politikaları temizleyelim
DROP POLICY IF EXISTS "Unified_Comments_Update" ON public.comments;
DROP POLICY IF EXISTS "Owner_Update_Comments" ON public.comments;
DROP POLICY IF EXISTS "Natural_Admin_Update" ON public.comments;
DROP POLICY IF EXISTS "Admins_Update_Comments" ON public.comments;

-- 2. "Adminler Her Şeyi Güncelleyebilir" Politikası
CREATE POLICY "Admins_Update_All_Comments"
ON public.comments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND ("memberStatus" IN ('Admin', 'Super Admin'))
    )
);

-- 3. "Kullanıcılar Sadece Kendi Yorumunu Güncelleyebilir" Politikası
CREATE POLICY "Users_Update_Own_Comments"
ON public.comments
FOR UPDATE
USING (
    -- Yorumun address kolonu == Kullanıcının address kolonu
    address IN (SELECT address FROM public.users WHERE id = (select auth.uid()))
);

-- 4. Insert ve Delete politikalarını da tazeleyelim (Garanti olsun)
DROP POLICY IF EXISTS "Comments_Insert_Policy" ON public.comments;
CREATE POLICY "Comments_Insert_Policy" ON public.comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Comments_Delete_Policy" ON public.comments;
CREATE POLICY "Comments_Delete_Policy" ON public.comments FOR DELETE USING (
    -- Admin silebilir VEYA Sahibi silebilir
    (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND "memberStatus" IN ('Admin', 'Super Admin')))
    OR
    (address IN (SELECT address FROM public.users WHERE id = (select auth.uid())))
);
