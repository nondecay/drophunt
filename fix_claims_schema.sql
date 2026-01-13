-- Ensure claims table exists and has all required columns
CREATE TABLE IF NOT EXISTS public.claims (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "projectName" TEXT,
  icon TEXT,
  link TEXT,
  type TEXT,
  "isUpcoming" BOOLEAN DEFAULT FALSE,
  deadline TEXT,
  "startDate" TEXT,
  fdv TEXT,
  whitelist TEXT,
  "createdAt" BIGINT DEFAULT extract(epoch from now()) * 1000
);

-- Add columns if they don't exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='deadline') THEN
        ALTER TABLE public.claims ADD COLUMN deadline TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='startDate') THEN
        ALTER TABLE public.claims ADD COLUMN "startDate" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='fdv') THEN
        ALTER TABLE public.claims ADD COLUMN fdv TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='whitelist') THEN
        ALTER TABLE public.claims ADD COLUMN whitelist TEXT;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='isUpcoming') THEN
        ALTER TABLE public.claims ADD COLUMN "isUpcoming" BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Claims are public" ON public.claims;
CREATE POLICY "Claims are public" ON public.claims FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage claims" ON public.claims;
CREATE POLICY "Admins can manage claims" ON public.claims FOR ALL USING (public.is_admin());
