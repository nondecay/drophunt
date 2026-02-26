-- Fix the missing or misnamed is_approved columns in comments and guides tables
DO $$ 
BEGIN 
    -- 1. Rename column in comments if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='isApproved') THEN
        ALTER TABLE public.comments RENAME COLUMN "isApproved" TO is_approved;
    END IF;

    -- Add is_approved it missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='is_approved') THEN
        ALTER TABLE public.comments ADD COLUMN is_approved BOOLEAN DEFAULT TRUE;
    END IF;

    -- 2. Rename column in guides if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guides' AND column_name='isApproved') THEN
        ALTER TABLE public.guides RENAME COLUMN "isApproved" TO is_approved;
    END IF;

    -- Add it if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guides' AND column_name='is_approved') THEN
        ALTER TABLE public.guides ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
    END IF;
END $$;


-- Create a function to calculate average rating and vote count safely
CREATE OR REPLACE FUNCTION update_project_rating() RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    v_count INTEGER;
    v_project_id TEXT;
BEGIN
    -- Determine the project ID based on the operation
    IF (TG_OP = 'DELETE') THEN
        v_project_id := OLD."airdropId";
    ELSE
        v_project_id := NEW."airdropId";
    END IF;

    -- Calculate the new average rating and total vote count
    SELECT COALESCE(AVG(rating), 0), COUNT(rating)
    INTO avg_rating, v_count
    FROM comments
    WHERE "airdropId" = v_project_id AND rating > 0 AND is_approved = true;

    -- Update the airdrops table (handle NULL if no ratings exist)
    UPDATE airdrops
    SET rating = COALESCE(avg_rating, 0),
        "voteCount" = COALESCE(v_count, 0)
    WHERE id = v_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop any previous trigger if running script multiple times
DROP TRIGGER IF EXISTS trigger_update_rating ON comments;

-- Recreate the single trigger to cover INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_project_rating();


-- Run a manual immediate fix strictly for all existing items so your dashboard reflects immediately
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Recalculate ratings and vote counts for all airdrops based on existing comments 
    FOR r IN SELECT id FROM airdrops LOOP
        UPDATE airdrops a
        SET rating = COALESCE((SELECT AVG(rating) FROM comments c WHERE c."airdropId" = a.id AND c.rating > 0 AND c.is_approved = true), 0),
            "voteCount" = COALESCE((SELECT COUNT(rating) FROM comments c WHERE c."airdropId" = a.id AND c.rating > 0 AND c.is_approved = true), 0)
        WHERE id = r.id;
    END LOOP;
END $$;
