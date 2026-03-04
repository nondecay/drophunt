-- SQL TO FIX ADMIN UUID MISMATCH AND SIMPLIFY RPC
-- The error is caused because your Web3 login created a new auth.users ID (bf59ae35-6e92-4d21-910c-621e361d1e09)
-- but your public.users table still thinks your ID is the old one (59d84d29-56cb-4db9-87cf-52b483766518).

-- 1. Temporarily drop the foreign key constraint to allow the ID update
ALTER TABLE public.admin_secrets DROP CONSTRAINT IF EXISTS admin_secrets_user_id_fkey;

-- 2. Update your public.users record to match your new session ID
UPDATE public.users 
SET id = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE id = '59d84d29-56cb-4db9-87cf-52b483766518';

-- 3. Update the admin_secrets record to point to the new ID
UPDATE public.admin_secrets 
SET user_id = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE user_id = '59d84d29-56cb-4db9-87cf-52b483766518';

-- 4. Re-add the foreign key constraint
ALTER TABLE public.admin_secrets 
ADD CONSTRAINT admin_secrets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Then, we simplify the RPC function so it doesn't strictly block you if this happens again:
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
