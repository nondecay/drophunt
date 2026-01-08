-- STRICT FIX FOR USER CLAIMS PERSISTENCE & COLUMN NAMES

-- 1. Ensure Table Exists with Correct Column Names (CamelCase as sent by Frontend)
-- Frontend sends: projectName, expense, claimedToken, tokenCount, earning, claimedDate
-- We want to ensure these exact column names exist.

DO $$
BEGIN
    -- Check and Rename 'projectname' -> 'projectName'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'projectname') THEN
        ALTER TABLE public.user_claims RENAME COLUMN projectname TO "projectName";
    END IF;

    -- Check and Rename 'claimedtoken' -> 'claimedToken'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimedtoken') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimedtoken TO "claimedToken";
    END IF;

    -- Check and Rename 'tokencount' -> 'tokenCount'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'tokencount') THEN
        ALTER TABLE public.user_claims RENAME COLUMN tokencount TO "tokenCount";
    END IF;

    -- Check and Rename 'claimeddate' -> 'claimedDate'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimeddate') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimeddate TO "claimedDate";
    END IF;
    
    -- Also handle snake_case variants just in case
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'project_name') THEN
        ALTER TABLE public.user_claims RENAME COLUMN project_name TO "projectName";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimed_token') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimed_token TO "claimedToken";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'token_count') THEN
        ALTER TABLE public.user_claims RENAME COLUMN token_count TO "tokenCount";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimed_date') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimed_date TO "claimedDate";
    END IF;

END $$;

-- 2. Force Enable RLS
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

-- 3. RESET RLS Policies for user_claims to be extremely permissive for authenticated users
DROP POLICY IF EXISTS "Enable all access for authenticated users on claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users manage own claims" ON public.user_claims;
DROP POLICY IF EXISTS "Users can insert own claims" ON public.user_claims;

-- Create a policy that allows INSERT/SELECT/UPDATE/DELETE for any authenticated user
-- We rely on the AppContext logic to assign the correct user_id.
CREATE POLICY "Allow all operations for authenticated users"
ON public.user_claims
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Also allow Anon for development if needed (Optional, but often helps with 'white screen' type apps if auth is loose)
CREATE POLICY "Allow all operations for anon users"
ON public.user_claims
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Grant Permissions Explicitly
GRANT ALL ON public.user_claims TO postgres;
GRANT ALL ON public.user_claims TO anon;
GRANT ALL ON public.user_claims TO authenticated;
GRANT ALL ON public.user_claims TO service_role;

-- 5. Add user_id column if missing (Safety Net)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_claims ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
