-- FIX USERS INSERT POLICY
-- Kullanıcıların kendi profillerini oluşturabilmesi için INSERT izni ekler.

DROP POLICY IF EXISTS "Users_Insert_Self" ON public.users;

CREATE POLICY "Users_Insert_Self"
ON public.users
FOR INSERT
WITH CHECK (
    -- User can insert if the ID matches their Auth ID
    -- OR if they are anonymous (for public registration flows, though usually we want auth)
    -- But since our code uses supabase.auth.setSession() BEFORE insert, they are authenticated.
    (auth.uid() = id) OR
    (auth.role() = 'authenticated') 
);

-- Ayrıca DELETE izni de verelim (kendi hesabını silme)
DROP POLICY IF EXISTS "Users_Delete_Self" ON public.users;
CREATE POLICY "Users_Delete_Self"
ON public.users
FOR DELETE
USING (
    (auth.uid() = id) OR
    (lower(address) = lower(get_auth_address()))
);
