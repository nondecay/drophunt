-- Fix for: Function public.update_project_rating has a role mutable search_path
-- Security Best Practice: Explicitly set search_path for SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION update_project_rating() RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    v_project_id TEXT;
BEGIN
    -- Determine the project ID based on the operation
    IF (TG_OP = 'DELETE') THEN
        v_project_id := OLD."airdropId";
    ELSE
        v_project_id := NEW."airdropId";
    END IF;

    -- Calculate the new average rating ONLY using APPROVED comments
    SELECT AVG(rating) INTO avg_rating
    FROM comments
    WHERE "airdropId" = v_project_id 
    AND rating > 0
    AND "isApproved" = true; -- CRITICAL: Only count approved comments

    -- Update the airdrops table
    UPDATE airdrops
    SET rating = COALESCE(avg_rating, 0)
    WHERE id = v_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
