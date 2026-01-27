-- PROMOTE USER TO ADMIN
-- This script manually promotes a specific user to Admin.
-- REPLACE 'YOUR_WALLET_ADDRESS_HERE' WITH THE ACTUAL ADDRESS!

UPDATE public.users
SET 
  "memberStatus" = 'Admin',  -- For RLS checks and UI
  role = 'admin'             -- For internal logic
WHERE address = 'YOUR_WALLET_ADDRESS_HERE'; -- <--- INPUT ADDRESS HERE

-- Verify the change
SELECT id, address, "memberStatus", role 
FROM public.users
WHERE address = 'YOUR_WALLET_ADDRESS_HERE';
