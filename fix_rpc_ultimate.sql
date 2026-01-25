-- FIX: AUTH ID vs PROFILE ID MISMATCH
-- The user is on the correct account, but the DB has disparate IDs for Auth vs Profile.
-- This script updates the security check to accept BOTH.

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

    -- ACCEPT BOTH IDs:
    -- 1. The ID visible on Frontend (Profile ID): 59d84d29...
    -- 2. The ID visible to Database (Auth ID): bf59ae35...
    
    IF v_uid = '59d84d29-56cb-4db9-87cf-52b483766518' 
       OR v_uid LIKE 'bf59ae35%' THEN 
        
        -- Authorized: Perform Insert
        INSERT INTO public.events (title, date, description, url)
        VALUES (p_title, p_date, p_description, p_url);
        
    ELSE
        -- Still Denied? Show the ID for further debugging
        RAISE EXCEPTION 'Unauthorized: Your Auth ID [%] implies you are not the admin.', v_uid;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_event TO authenticated;
