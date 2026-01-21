-- FIX: RPC DELETE (TYPE MISMATCH)
-- The 'events.id' column is TEXT, but the previous function used UUID.
-- This caused "operator does not exist: text = uuid".
-- We fix this by changing the parameter to TEXT.

-- 1. Drop the incorrect function (to avoid duplicate signatures)
DROP FUNCTION IF EXISTS public.delete_admin_event(uuid);

-- 2. Create the Correct Function
CREATE OR REPLACE FUNCTION public.delete_admin_event(
    p_event_id text -- CHANGED FROM UUID TO TEXT
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
        WHERE id = p_event_id; -- Now comparing text = text (Correct)
        
    ELSE
        RAISE EXCEPTION 'Unauthorized Delete Attempt. ID: [%]', v_uid;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_admin_event TO authenticated;
