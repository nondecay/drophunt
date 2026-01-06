
-- FINAL ADMIN SETUP (WALLET BASED)
-- Use this script to promote your WALLET ADDRESS to Admin.

-- 1. Enable Hash Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  -- !!! REPLACE THIS WITH YOUR WALLET ADDRESS !!!
  target_address text := '0xYOUR_WALLET_ADDRESS_HERE'; 
  
  -- !!! REPLACE THIS WITH YOUR DESIRED PASSWORD !!!
  new_password text := 'ChangeThisPasswordNow!';
  
  user_record record;
BEGIN
  -- 1. Find the user by address
  SELECT * INTO user_record FROM public.users WHERE address = target_address;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User with address % not found. Please connect your wallet to the site first!', target_address;
  END IF;

  -- 2. Promote to Admin
  UPDATE public.users 
  SET role = 'admin', "memberStatus" = 'Admin'
  WHERE id = user_record.id;

  -- 3. Set Password
  INSERT INTO public.admin_secrets (user_id, password_hash, failed_attempts)
  VALUES (
    user_record.id, 
    crypt(new_password, gen_salt('bf')), 
    0
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    failed_attempts = 0,
    locked_until = NULL;

  RAISE NOTICE 'SUCCESS: Wallet % is now Admin.', target_address;
END $$;
