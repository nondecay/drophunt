-- Yorumlarda ve diğer her yerde kullanıcıların kendi aralarında avatarlarını, ranklarını ve isimlerini görebilmesi için 
-- 'users' tablosundaki 'SELECT' izninin herkese açık (public) olması gerekir. Aksi halde yorumlar bölümünde RLS devreye girer
-- ve sadece adminler/bağlı kullanıcılar diğerlerinin avatarsını görebilir!

DROP POLICY IF EXISTS "Admins can view users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users 
FOR SELECT 
USING (true);
