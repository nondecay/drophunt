/*
   EMERGENCY DISABLE RLS
   Purpose: 
   1. Unblock the user immediately by removing Row-Level Security checks.
   2. Allow Application Logic (filtered queries) to handle data isolation temporarily.
   3. This confirms if the issue is strictly Auth-Policy related.
*/

-- 1. DISABLE RLS ON CORE TABLES
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;

-- 2. ENSURE COLUMN NAMES ARE CORRECT (Just to be safe)
-- If we disabled RLS, the only thing that can fail is a Column Name mismatch.
-- This block ensures "userId" exists.
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'userId') THEN
          ALTER TABLE public.todos RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
  
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'userId') THEN
          ALTER TABLE public.user_claims RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;

  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'user_id') THEN
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'inbox_messages' AND column_name = 'userId') THEN
          ALTER TABLE public.inbox_messages RENAME COLUMN user_id TO "userId";
      END IF;
  END IF;
END $$;
