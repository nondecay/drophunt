-- CREATE RPC FUNCTION TO UPDATE USER ROLES
-- This entirely bypasses RLS for the specific action of an Admin updating someone else's role.

CREATE OR REPLACE FUNCTION public.update_user_role_admin(
  p_target_address TEXT,
  p_new_status TEXT,
  p_new_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_caller_status TEXT;
  v_caller_role TEXT;
BEGIN
  -- 1. Check if the caller is an admin
  SELECT "memberStatus", role::text INTO v_caller_status, v_caller_role
  FROM public.users
  WHERE id = auth.uid();
  
  IF v_caller_role = 'admin' OR v_caller_status IN ('Admin', 'Super Admin') THEN
    -- 2. Update the target user using the enum type cast
    UPDATE public.users 
    SET "memberStatus" = p_new_status, role = p_new_role::public.user_role
    WHERE address = p_target_address;
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Not authorized. You are neither an admin role nor an Admin memberStatus.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
