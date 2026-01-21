-- ==============================================================================
-- RLS DEBUGGING TOOL (DIAGNOSTIC MODE)
-- Bu script RLS hatasının KÖK NEDENİNİ bulmak için özel bir "Loglama" sistemi kurar.
-- ==============================================================================

BEGIN;

-- 1. Log Tablosu Oluştur (Hata ayıklama verileri için)
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id serial primary key,
    event_time timestamp default now(),
    auth_uid text,
    user_row_found boolean,
    user_status text,
    message text
);

-- Log tablosunu herkese aç (Okuyabilelim diye)
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All_Access_Debug" ON public.debug_logs;
CREATE POLICY "All_Access_Debug" ON public.debug_logs FOR ALL USING (true);


-- 2. "Ajan" Admin Fonksiyonu
-- Bu fonksiyon hem yetki kontrolü yapar HEM DE arka planda log tutar.
CREATE OR REPLACE FUNCTION public.debug_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid text;
  u_status text;
  is_match boolean;
  user_found boolean;
BEGIN
  current_uid := auth.uid()::text;
  
  -- Users tablosunda bu ID var mı bak
  SELECT "memberStatus" INTO u_status
  FROM public.users
  WHERE id::text = current_uid; -- Text cast ile garanti kontrol
  
  user_found := (u_status IS NOT NULL);
  is_match := (u_status IN ('Admin', 'Super Admin'));

  -- LOG OLUSTUR (Bu satır sorunu çözecek ipucunu verecek)
  INSERT INTO public.debug_logs (auth_uid, user_row_found, user_status, message)
  VALUES (
    COALESCE(current_uid, 'NULL'),       -- Supabase Auth ID ne görüyor?
    user_found,                          -- Tabloda kaydın var mı?
    COALESCE(u_status, 'UNKNOWN'),       -- Statün ne görünüyor?
    CASE WHEN is_match THEN 'SUCCESS' ELSE 'DENIED' END
  );

  RETURN is_match;
END;
$$;
ALTER FUNCTION public.debug_is_admin() OWNER TO postgres;


-- 3. Airdrops Tablosuna Bu Ajanı Yerleştir
DROP POLICY IF EXISTS "Admin_Write_airdrops" ON public.airdrops;

-- INSERT / UPDATE / DELETE için bu fonksiyonu kullan
CREATE POLICY "Admin_Write_airdrops" ON public.airdrops FOR ALL 
USING (public.debug_is_admin())
WITH CHECK (public.debug_is_admin());

COMMIT;
