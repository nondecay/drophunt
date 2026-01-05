-- MANUAL ADMIN SETUP SCRIPT
-- this script allows you to manually assign the Admin Role and Password via Supabase SQL Editor.
-- You do NOT need a wallet address. You need your User UUID.

-- 1. Enable Hash Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  -- REPLACE THIS WITH YOUR USER UUID (Found in Supabase Auth > Users column "User UID")
  target_uuid uuid := '00000000-0000-0000-0000-000000000000'; 
  
  -- REPLACE THIS WITH YOUR DESIRED ADMIN PASSWORD
  new_password text := 'ChangeThisToYourStrongPassword123!';
BEGIN
  -- 1. Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = target_uuid) THEN
    RAISE EXCEPTION 'User with UUID % not found. Please sign up sequentially first.', target_uuid;
  END IF;

  -- 2. Promote to Admin
  UPDATE public.users 
  SET role = 'admin' 
  WHERE id = target_uuid;

  -- 3. Set/Reset Admin Password (using BCrypt via pgcrypto)
  INSERT INTO public.admin_secrets (user_id, password_hash, failed_attempts)
  VALUES (
    target_uuid, 
    crypt(new_password, gen_salt('bf')), -- Hashes the password securely
    0
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    failed_attempts = 0,
    locked_until = NULL;

  RAISE NOTICE 'SUCCESS: User % is now an Admin with the specified password.', target_uuid;
END $$;
