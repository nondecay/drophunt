-- FIX: RPC DEBUGGING
-- The previous error said "Unauthorized", meaning the ID check failed.
-- We need to know WHAT ID the database actually sees to fix the mismatch.

CREATE OR REPLACE FUNCTION public.create_admin_event(
    p_title text,
    p_date text,
    p_description text,
    p_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid text;
BEGIN
    -- Capture the ID strictly as text
    v_uid := auth.uid()::text;

    -- Check and Raise Detailed Error if mismatch
    IF v_uid IS NULL OR v_uid <> '59d84d29-56cb-4db9-87cf-52b483766518' THEN
        RAISE EXCEPTION 'Unauthorized: The Database sees your ID as: [%]', v_uid;
    END IF;

    -- Direct Insert
    INSERT INTO public.events (title, date, description, url)
    VALUES (p_title, p_date, p_description, p_url);
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_event TO authenticated;
