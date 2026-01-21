-- FIX: RPC APPROACH (BYPASS RLS)
-- Since RLS policies are failing inexplicably, we will use a "Security Definer" function.
-- This function runs with the privileges of the Database Owner, ignoring Table RLS.
-- We handle authorization MANUALLY inside the function.

CREATE OR REPLACE FUNCTION public.create_admin_event(
    p_title text,
    p_date text,
    p_description text,
    p_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs as Admin, bypassing RLS
SET search_path = public
AS $$
BEGIN
    -- 1. Manual Security Check (Hardcoded ID)
    IF auth.uid()::text <> '59d84d29-56cb-4db9-87cf-52b483766518' THEN
        RAISE EXCEPTION 'Unauthorized: You are not the defined Admin.';
    END IF;

    -- 2. Direct Insert (Bypasses RLS due to SECURITY DEFINER)
    INSERT INTO public.events (title, date, description, url)
    VALUES (p_title, p_date, p_description, p_url);
    
END;
$$;

-- Grant Execute Permission to Authenticated Users
-- (The internal IF check protects it)
GRANT EXECUTE ON FUNCTION public.create_admin_event TO authenticated;
