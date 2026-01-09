-- Force update of all project ratings based on APPROVED comments only
-- Run this once to fix any existing data discrepancies

UPDATE airdrops a
SET rating = COALESCE((
    SELECT AVG(rating)
    FROM comments c
    WHERE c."airdropId" = a.id
    AND c."isApproved" = true
    AND c.rating > 0
), 0);

-- Also ensure the trigger is definitely correct (re-applying just in case)
CREATE OR REPLACE FUNCTION update_project_rating() RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    v_project_id TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_project_id := OLD."airdropId";
    ELSE
        v_project_id := NEW."airdropId";
    END IF;

    SELECT AVG(rating) INTO avg_rating
    FROM comments
    WHERE "airdropId" = v_project_id 
    AND rating > 0
    AND "isApproved" = true;

    UPDATE airdrops
    SET rating = COALESCE(avg_rating, 0)
    WHERE id = v_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
