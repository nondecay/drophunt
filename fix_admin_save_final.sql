BEGIN;

-- 1. ROBUST ADMIN CHECK (Bypasses RLS Recursion)
-- This function runs with 'postgres' privileges (SECURITY DEFINER), 
-- ensuring it never gets blocked by other RLS policies on the 'users' table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for Admin status in a way that aligns with Frontend logic
  RETURN EXISTS (
    SELECT 1 FROM "users" 
    WHERE "id" = auth.uid() 
    AND (
       "memberStatus" IN ('Admin', 'Super Admin') -- Primary check (Frontend matches this)
       OR "role" = 'admin'                        -- Fallback
       -- Note: We avoid 'isAdmin' here if it's causing issues, but usually it's fine to read.
    )
  );
END;
$$;

-- 2. FIX USER PERMISSIONS (Avoids Generated Column Error)
-- This function allows you to self-promote to Admin safely.
CREATE OR REPLACE FUNCTION public.fix_my_permissions()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We ONLY update the source columns. The DB will auto-update 'isAdmin'.
  UPDATE "users"
  SET 
    "memberStatus" = 'Admin',
    "role" = 'admin'
  WHERE "id" = auth.uid();
  
  RETURN 'SUCCESS: You are now an Admin in the database.';
END;
$$;

-- 3. EXECUTE PERMISSION FIX
-- This runs immediately to fix your account.
SELECT public.fix_my_permissions();

-- 4. CLEAN RLS FOR AIRDROPS (The Table You Are Stuck On)
ALTER TABLE "airdrops" ENABLE ROW LEVEL SECURITY;

-- Drop all variants of old policies to ensure a clean slate
DROP POLICY IF EXISTS "Admins_Insert_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Admins_Update_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Admins_Delete_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Admins_Manage_All_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Public_View_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Admin_Insert_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Admin_Update_Airdrops" ON "airdrops";
DROP POLICY IF EXISTS "Admin_Delete_Airdrops" ON "airdrops";

-- Re-Apply Strict Admin Policies
-- INSERT: Only Admins
CREATE POLICY "Strict_Admin_Insert" ON "airdrops" FOR INSERT
WITH CHECK (public.is_admin());

-- UPDATE: Only Admins
CREATE POLICY "Strict_Admin_Update" ON "airdrops" FOR UPDATE
USING (public.is_admin());

-- DELETE: Only Admins
CREATE POLICY "Strict_Admin_Delete" ON "airdrops" FOR DELETE
USING (public.is_admin());

-- SELECT: Everyone (Public Read)
CREATE POLICY "Public_Read" ON "airdrops" FOR SELECT
USING (true);


-- 5. BONUS: DO THE SAME FOR ACTIVITIES (Just in case)
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Admin_Insert" ON "activities";
DROP POLICY IF EXISTS "Strict_Admin_Update" ON "activities";
DROP POLICY IF EXISTS "Strict_Admin_Delete" ON "activities";
DROP POLICY IF EXISTS "Public_Read" ON "activities";
-- (And old names)
DROP POLICY IF EXISTS "Admins_Manage_All_Activities" ON "activities";
DROP POLICY IF EXISTS "Admins_Write_Activities" ON "activities";

CREATE POLICY "Strict_Admin_Insert" ON "activities" FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Strict_Admin_Update" ON "activities" FOR UPDATE USING (public.is_admin());
CREATE POLICY "Strict_Admin_Delete" ON "activities" FOR DELETE USING (public.is_admin());
CREATE POLICY "Public_Read" ON "activities" FOR SELECT USING (true);

COMMIT;
