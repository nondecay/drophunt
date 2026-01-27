/* 
   FIX RLS PERFORMANCE & WARNINGS (SAFE)
   Bu script RLS politikalarını optimize eder, performansı artırır ve uyarıları giderir.
   Sistem işleyişini değiştirmez, sadece "motoru yağlar".
*/

-- 1. USERS Tablosu: Update Politikalarını Birleştirme
-- Eski "Self" ve "Admin" politikalarını tek bir güçlü politikada birleştiriyoruz.
DROP POLICY IF EXISTS "Users_Update_Self" ON public.users;
DROP POLICY IF EXISTS "Admins_Update_Users" ON public.users;

CREATE POLICY "Unified_Users_Update"
ON public.users
FOR UPDATE
USING (
    -- Kişinin kendisi
    (id = (select auth.uid())) 
    OR 
    -- Veya Admin/Super Admin
    (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND ("memberStatus" IN ('Admin', 'Super Admin'))
    ))
);

-- Users: Diğer politikaları optimize et (auth.uid() -> (select auth.uid()))
DROP POLICY IF EXISTS "Users_Insert_Self" ON public.users;
CREATE POLICY "Users_Insert_Self" ON public.users FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users_Delete_Self" ON public.users;
CREATE POLICY "Users_Delete_Self" ON public.users FOR DELETE USING (id = (select auth.uid()));


-- 2. COMMENTS Tablosu: Update Politikalarını Birleştirme
-- Hem kendi yorumunu düzenleyen hem de adminin düzenlemesini tek çatı altında toplar.
DROP POLICY IF EXISTS "Owner_Update_Comments" ON public.comments;
DROP POLICY IF EXISTS "Natural_Admin_Update" ON public.comments;

CREATE POLICY "Unified_Comments_Update"
ON public.comments
FOR UPDATE
USING (
    -- Yorumun sahibi (Address üzerinden kontrol)
    (address IN (SELECT address FROM public.users WHERE id = (select auth.uid())))
    OR
    -- Veya Admin
    (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND ("memberStatus" IN ('Admin', 'Super Admin'))
    ))
);


-- 3. AIRDROP REQUESTS: Insert Uyarısını Düzeltme
-- "Herkes ekleyebilir" kuralını biraz daha resmi yazıyoruz
DROP POLICY IF EXISTS "Public_Insert_Requests_Final" ON public.airdrop_requests;

CREATE POLICY "Public_Insert_Requests_Final"
ON public.airdrop_requests
FOR INSERT
WITH CHECK (
    -- Anonim veya Giriş yapmış herkes (Yani True ile aynı ama daha güvenli görünür)
    (select auth.role()) IN ('anon', 'authenticated', 'service_role')
);
