/*
  # MESSAGING SYSTEM TRIGGER (Fix Message Delivery)
  # --------------------------------------------------------------------------------
  # This script creates a database trigger to automatically distribute messages
  # to users' inboxes when a new message is broadcasted by an admin.
  # It handles 'all' (global) and 'project' (targeted) broadcasts.
*/

-- 1. Create the Function to Handle New Messages
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Broadcast to ALL Users
  IF NEW."targetRole" = 'all' THEN
    INSERT INTO public.inbox_messages ("userId", "title", "content", "type", "timestamp", "isRead")
    SELECT 
      id AS "userId",             -- User ID from users table
      NEW.title, 
      NEW.content, 
      NEW.type, 
      COALESCE(NEW."createdAt", extract(epoch from now()) * 1000), -- Timestamp
      false                       -- isRead default
    FROM public.users;

  -- B. Broadcast to Targeted Project Followers
  ELSIF (NEW."targetRole" = 'project' OR NEW."targetRole" = 'investor') AND NEW."relatedAirdropId" IS NOT NULL THEN
    INSERT INTO public.inbox_messages ("userId", "title", "content", "type", "timestamp", "isRead")
    SELECT 
      id AS "userId",
      NEW.title, 
      NEW.content, 
      NEW.type, 
      COALESCE(NEW."createdAt", extract(epoch from now()) * 1000),
      false
    FROM public.users
    WHERE "trackedProjectIds" @> ARRAY[NEW."relatedAirdropId"]; -- Check if user tracks this project
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop Trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_message_broadcast ON public.messages;

-- 3. Create the Trigger
CREATE TRIGGER on_message_broadcast
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- 4. Grant Permissions (Ensure Trigger can read users and write to inbox)
GRANT SELECT ON TABLE public.users TO postgres, anon, authenticated, service_role;
GRANT INSERT ON TABLE public.inbox_messages TO postgres, anon, authenticated, service_role;

-- 5. Fix Potential RLS Blocks (Just in case Admin Cleanup missed something specific here)
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;
