-- Fix Notifications RLS to match the rest of the application's open RLS architecture
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public notifications access" ON public.notifications;

CREATE POLICY "Public notifications access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
