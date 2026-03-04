-- SQL TO FIX ADMIN UUID MISMATCH - ROBUST VERSION
-- Uses DISABLE TRIGGER ALL to temporarily bypass foreign key checks
-- which is the cleanest way to update a primary key synced across many tables.

-- 1. Disable constraints (triggers) temporarily
ALTER TABLE public.users DISABLE TRIGGER ALL;
ALTER TABLE public.admin_secrets DISABLE TRIGGER ALL;
ALTER TABLE public.inbox_messages DISABLE TRIGGER ALL;
ALTER TABLE public.todos DISABLE TRIGGER ALL;
ALTER TABLE public.user_claims DISABLE TRIGGER ALL;

-- 2. Update the parent table (users)
UPDATE public.users 
SET id = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE id = '59d84d29-56cb-4db9-87cf-52b483766518';

-- 3. Update all child tables tracking the user ID
UPDATE public.admin_secrets 
SET user_id = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE user_id = '59d84d29-56cb-4db9-87cf-52b483766518';

UPDATE public.inbox_messages 
SET "userId" = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE "userId" = '59d84d29-56cb-4db9-87cf-52b483766518';

UPDATE public.todos 
SET "userId" = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE "userId" = '59d84d29-56cb-4db9-87cf-52b483766518';

UPDATE public.user_claims 
SET "userId" = 'bf59ae35-6e92-4d21-910c-621e361d1e09' 
WHERE "userId" = '59d84d29-56cb-4db9-87cf-52b483766518';

-- 4. Re-enable the constraints (triggers)
ALTER TABLE public.user_claims ENABLE TRIGGER ALL;
ALTER TABLE public.todos ENABLE TRIGGER ALL;
ALTER TABLE public.inbox_messages ENABLE TRIGGER ALL;
ALTER TABLE public.admin_secrets ENABLE TRIGGER ALL;
ALTER TABLE public.users ENABLE TRIGGER ALL;

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
