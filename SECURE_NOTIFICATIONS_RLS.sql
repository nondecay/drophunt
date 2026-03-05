ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public notifications access" ON public.notifications;
DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Notifications are viewable by everyone" ON public.notifications FOR SELECT USING (true);

CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING ( EXISTS ( SELECT 1 FROM public.users WHERE id = auth.uid() AND ( "isAdmin" = true OR "memberStatus" IN ('Admin', 'Super Admin') ) ) ) WITH CHECK ( EXISTS ( SELECT 1 FROM public.users WHERE id = auth.uid() AND ( "isAdmin" = true OR "memberStatus" IN ('Admin', 'Super Admin') ) ) );
