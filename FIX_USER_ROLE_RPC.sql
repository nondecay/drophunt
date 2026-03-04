-- CREATE RPC FUNCTION TO UPDATE USER ROLES (SIMPLE VERSION)
-- The UUID sync was causing too many foreign key issues. 
-- We are removing the strict UUID check. If your wallet address is an Admin, you can update roles.

CREATE OR REPLACE FUNCTION public.update_user_role_admin(
  p_caller_address TEXT,
  p_target_address TEXT,
  p_new_status TEXT,
  p_new_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_caller_status TEXT;
  v_caller_role TEXT;
BEGIN
  -- We fetch caller using the given address
  SELECT "memberStatus", role::text INTO v_caller_status, v_caller_role
  FROM public.users
  WHERE lower(address) = lower(p_caller_address);
  
  -- If we didn't find the user
  IF v_caller_status IS NULL THEN
    RAISE EXCEPTION 'Caller address % not found in DB.', p_caller_address;
  END IF;

  -- Check admin permissions (Only Admin or Super Admin)
  IF v_caller_role = 'admin' OR v_caller_status IN ('Admin', 'Super Admin') THEN
    UPDATE public.users 
    SET "memberStatus" = p_new_status, role = p_new_role::public.user_role
    WHERE lower(address) = lower(p_target_address);
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Not authorized. You are neither an admin role nor an Admin memberStatus.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
