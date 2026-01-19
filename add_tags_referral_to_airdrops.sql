-- Add tags and referral_code columns to airdrops table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airdrops' AND column_name = 'tags') THEN
        ALTER TABLE public.airdrops ADD COLUMN tags text[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airdrops' AND column_name = 'referral_code') THEN
        ALTER TABLE public.airdrops ADD COLUMN referral_code text;
    END IF;
END $$;
