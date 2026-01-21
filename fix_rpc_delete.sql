-- FIX: RPC DELETE (BYPASS RLS)
-- Allows the admin to delete events safely, handling the ID mismatch.

CREATE OR REPLACE FUNCTION public.delete_admin_event(
    p_event_id uuid
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

    -- Security Check (Accepts both Profile ID and Auth ID)
    IF v_uid = '59d84d29-56cb-4db9-87cf-52b483766518' 
       OR v_uid LIKE 'bf59ae35%' THEN 
        
        -- Authorized: Perform Delete
        DELETE FROM public.events
        WHERE id = p_event_id;
        
    ELSE
        RAISE EXCEPTION 'Unauthorized Delete Attempt. ID: [%]', v_uid;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_admin_event TO authenticated;
