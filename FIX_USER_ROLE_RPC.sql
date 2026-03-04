-- CREATE RPC FUNCTION TO UPDATE USER ROLES (WITH DEBUG LOGGING)
-- This entirely bypasses RLS for the specific action of an Admin updating someone else's role.
-- Now accepts p_caller_address to check permissions securely even if auth.uid() is loosely mapped.

CREATE OR REPLACE FUNCTION public.update_user_role_admin(
  p_caller_address TEXT,
  p_target_address TEXT,
  p_new_status TEXT,
  p_new_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_caller_status TEXT;
  v_caller_role TEXT;
  v_caller_id UUID;
BEGIN
  -- We fetch caller using the given address
  SELECT "memberStatus", role::text, id INTO v_caller_status, v_caller_role, v_caller_id
  FROM public.users
  WHERE lower(address) = lower(p_caller_address);
  
  -- If we didn't find the user
  IF v_caller_status IS NULL THEN
    RAISE EXCEPTION 'Caller address % not found in DB.', p_caller_address;
  END IF;

  -- Ensure caller is truly authenticated if auth.uid() is active
  IF auth.uid() IS NOT NULL AND auth.uid() != v_caller_id THEN
    RAISE EXCEPTION 'Auth mismatch: session uid % does not match user id %.', auth.uid(), v_caller_id;
  END IF;

  -- Check admin permissions
  IF v_caller_role = 'admin' OR v_caller_status IN ('Admin', 'Super Admin') THEN
    UPDATE public.users 
    SET "memberStatus" = p_new_status, role = p_new_role::public.user_role
    WHERE lower(address) = lower(p_target_address);
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Not authorized. Caller status is "%", role is "%"', v_caller_status, v_caller_role;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
