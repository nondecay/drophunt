-- Create a function to calculate average rating
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

    -- Calculate the new average rating
    SELECT AVG(rating) INTO avg_rating
    FROM comments
    WHERE "airdropId" = v_project_id AND rating > 0;

    -- Update the airdrops table (handle NULL if no ratings exist, default to 0 or keep existing if preferred, but usually 0 or null)
    -- We'll default to 0 if no ratings.
    UPDATE airdrops
    SET rating = COALESCE(avg_rating, 0)
    WHERE id = v_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_rating ON comments;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_project_rating();
