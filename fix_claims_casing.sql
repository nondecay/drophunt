-- Fix User Claims Column Casing to match Frontend (CamelCase)
-- We suspect columns might be lowercase 'projectname' or snake_case 'project_name'
-- We want "projectName" (quoted)

DO $$ 
BEGIN 
    -- 1. Fix projectName
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'projectname') THEN
        ALTER TABLE public.user_claims RENAME COLUMN projectname TO "projectName";
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'project_name') THEN
        ALTER TABLE public.user_claims RENAME COLUMN project_name TO "projectName";
    END IF;

    -- 2. Fix claimedToken
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimedtoken') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimedtoken TO "claimedToken";
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimed_token') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimed_token TO "claimedToken";
    END IF;

    -- 3. Fix tokenCount
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'tokencount') THEN
        ALTER TABLE public.user_claims RENAME COLUMN tokencount TO "tokenCount";
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'token_count') THEN
        ALTER TABLE public.user_claims RENAME COLUMN token_count TO "tokenCount";
    END IF;

    -- 4. Fix claimedDate
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimeddate') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimeddate TO "claimedDate";
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_claims' AND column_name = 'claimed_date') THEN
        ALTER TABLE public.user_claims RENAME COLUMN claimed_date TO "claimedDate";
    END IF;

END $$;
