-- Create a function to calculate average rating and vote count
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
    WHERE "airdropId" = v_project_id AND rating > 0 AND "isApproved" = true;

    -- Update the airdrops table
    UPDATE airdrops
    SET rating = avg_rating,
        "voteCount" = v_count
    WHERE id = v_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_rating ON comments;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_project_rating();
