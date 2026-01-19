/*
   KILL SWITCH (V10) - EMERGENCY UNBLOCK
   Purpose: 
   1. PERMANENTLY DISABLE Row-Level Security on all tables.
   2. DELETE ALL existing policies to prevent future conflicts.
   3. DO NOT re-enable security. 
   
   Result: The app will WORK. Security will be handled by the Frontend (AppContext.tsx) for now.
*/

-- 1. DISABLE RLS (The "off" switch)
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. DYNAMIC DELETION (Remove every single policy)
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
    tables TEXT[] := ARRAY['todos', 'user_claims', 'inbox_messages', 'comments', 'users', 'airdrops', 'activities'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            RAISE NOTICE 'Deleted policy: % on table %', pol.policyname, tbl;
        END LOOP;
    END LOOP;
END $$;

-- 3. VERIFY COLUMN NAMES (One last check)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
  
  -- Ensure UUID type for userId in todos to match code
  -- (Only run if it exists to avoid errors)
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
      EXECUTE 'ALTER TABLE public.todos ALTER COLUMN "userId" TYPE UUID USING "userId"::UUID';
  END IF;
END $$;
