-- DropHunt Notifications System Migration

-- 1. Add new arrays to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "readNotifications" TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "hiddenNotifications" TEXT[] DEFAULT '{}';

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('general', 'project')),
    "targetProjectId" TEXT, -- Can be null for general notifications
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    author TEXT NOT NULL
);

-- 3. Set up RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read notifications
DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON public.notifications;
CREATE POLICY "Notifications are viewable by everyone"
ON public.notifications
FOR SELECT
USING (true);

-- Allow admins to manage notifications (Insert, Update, Delete)
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Clean up legacy messages table if it exists (Optional, you can keep the table data but we won't use it in UI)
-- DROP TABLE IF EXISTS public.messages;
-- DROP TABLE IF EXISTS public.inbox_messages;
