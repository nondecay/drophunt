-- FIX TRACKING PERSISTENCE
-- 1. Adds "trackedProjectIds" column if missing to Users table.
-- 2. Ensures RLS policies allow users to update their own profile.

DO $$ 
BEGIN 
    -- Check for column existence (camelCase quoted)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trackedProjectIds') THEN
        ALTER TABLE public.users ADD COLUMN "trackedProjectIds" TEXT[] DEFAULT '{}';
    END IF;

    -- Also check for snake_case version just in case, ensuring we have at least one valid target
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tracked_project_ids') THEN
        -- Optional: We prioritize trackedProjectIds, but adding this for compatibility if new code expects it
        -- ALTER TABLE public.users ADD COLUMN tracked_project_ids TEXT[] DEFAULT '{}';
        -- Commented out to avoid clutter, adhering to camelCase from types.ts
    END IF;
END $$;

-- RLS UPDATE
-- Ensure users can update their own rows
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE USING (
    auth.uid() = id
);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
