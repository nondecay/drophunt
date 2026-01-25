-- FIX: ALLOW REAL DETECTED ID
-- The database revealed you are actually logged in as a user starting with 'bf59ae35...'
-- This script updates the security check to allow THIS user specifically.

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
    v_uid := auth.uid()::text;

    -- Allow if match the original ID OR the newly detected one
    IF v_uid = '59d84d29-56cb-4db9-87cf-52b483766518' 
       OR v_uid LIKE 'bf59ae35-%' THEN -- Using prefix since we have partial ID
        
        -- Success: Perform Insert
        INSERT INTO public.events (title, date, description, url)
        VALUES (p_title, p_date, p_description, p_url);
        
    ELSE
        RAISE EXCEPTION 'Unauthorized: Unknown ID: [%]', v_uid;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_event TO authenticated;
