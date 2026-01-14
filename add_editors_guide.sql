-- Add editorsGuide column to airdrops table
ALTER TABLE public.airdrops 
ADD COLUMN IF NOT EXISTS "editorsGuide" TEXT;
