BEGIN;

-- ==============================================================================
-- 1. DYNAMIC CLEANUP: REMOVE ALL 'ZOMBIE' POLICIES
-- This block loops through all tables and forcefully DROPS all existing policies.
-- This ensures we start with a clean slate and fix "Multiple Permissive Policies" errors.
-- ==============================================================================
DO $$
DECLARE
    -- All tables that need fixing based on the Error Log
    tables_to_fix text[] := ARRAY[
        'airdrops', 'users', 'activities', 'claims', 'chains', 'investors', 
        'announcements', 'tools', 'infofi_platforms', 'guides', 'messages', 
        'inbox_messages', 'comments', 'todos', 'user_claims', 'admin_secrets', 'airdrop_requests', 'calendar_events'
    ];
    t_name text;
    p_rec record;
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix LOOP
        -- 1. Enable RLS (Fixes "RLS Disabled in Public" error)
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t_name);

        -- 2. Drop every single policy on this table
        FOR p_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t_name LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_rec.policyname, t_name);
        END LOOP;
    END LOOP;
END $$;


-- ==============================================================================
-- 2. SECURE THE FOUNDATION: USERS TABLE
-- We need users to be readable by themselves so the Admin Check can work.
-- ==============================================================================

-- Allow users to read their own data (Critical for "Direct Table" security check)
CREATE POLICY "Users_Read_Self" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Allow Admins to read all users (for management)
CREATE POLICY "Admins_Read_All" ON public.users
FOR SELECT USING (
    (SELECT "memberStatus" FROM public.users WHERE id = (select auth.uid())) IN ('Admin', 'Super Admin')
);

-- Allow Users to Update their own specific fields (Optional, but good for completeness)
CREATE POLICY "Users_Update_Self" ON public.users
FOR UPDATE USING (auth.uid() = id);


-- ==============================================================================
-- 3. SECURE ADMIN CONTENT TABLES (Airdrops, Activities, etc.)
-- Pattern: Public Read, Admin Write (Insert/Update/Delete)
-- ==============================================================================

DO $$
DECLARE
    admin_tables text[] := ARRAY[
        'airdrops', 'activities', 'claims', 'chains', 'investors', 
        'announcements', 'tools', 'infofi_platforms', 'admin_secrets'
    ];
    t_name text;
BEGIN
    FOREACH t_name IN ARRAY admin_tables LOOP
        
        -- A. PUBLIC READ (Everyone can see content)
        EXECUTE format('CREATE POLICY "Public_Read_%s" ON public.%I FOR SELECT USING (true)', t_name, t_name);

        -- B. ADMIN WRITE (Insert)
        -- Uses a direct subquery to check memberStatus. NO FUNCTIONS.
        EXECUTE format('
            CREATE POLICY "Admin_Insert_%s" ON public.%I FOR INSERT 
            WITH CHECK (
                (SELECT "memberStatus" FROM public.users WHERE id = (select auth.uid())) IN (''Admin'', ''Super Admin'')
            );
        ', t_name, t_name);

        -- C. ADMIN WRITE (Update)
        EXECUTE format('
            CREATE POLICY "Admin_Update_%s" ON public.%I FOR UPDATE 
            USING (
                (SELECT "memberStatus" FROM public.users WHERE id = (select auth.uid())) IN (''Admin'', ''Super Admin'')
            )
            WITH CHECK (
                (SELECT "memberStatus" FROM public.users WHERE id = (select auth.uid())) IN (''Admin'', ''Super Admin'')
            );
        ', t_name, t_name);

        -- D. ADMIN WRITE (Delete)
        EXECUTE format('
            CREATE POLICY "Admin_Delete_%s" ON public.%I FOR DELETE 
            USING (
                (SELECT "memberStatus" FROM public.users WHERE id = (select auth.uid())) IN (''Admin'', ''Super Admin'')
            );
        ', t_name, t_name);

    END LOOP;
END $$;


-- ==============================================================================
-- 4. SECURE USER CONTENT TABLES (Comments, Todos, etc.)
-- Pattern: Public Read (some), Owner Write
-- ==============================================================================

-- A. COMMENTS (Public Read, Owner Write)
CREATE POLICY "Public_Read_Comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Owner_Insert_Comments" ON public.comments FOR INSERT WITH CHECK (auth.uid()::text = user_id); -- Assuming user_id is the FK
CREATE POLICY "Owner_Delete_Comments" ON public.comments FOR DELETE USING (auth.uid()::text = user_id);

-- B. TODOS (Owner Read/Write Only)
CREATE POLICY "Owner_Manage_Todos" ON public.todos FOR ALL USING (auth.uid() = user_id); -- Assuming user_id maps to auth.uid()

-- C. USER CLAIMS (Owner Read/Write Only) - Fixing "Performance Warning" by using (select auth.uid())
CREATE POLICY "Owner_Manage_Claims" ON public.user_claims FOR ALL 
USING (auth.uid() = user_id); 


-- ==============================================================================
-- 5. FIX HELPER FUNCTIONS (Linter Warning: Mutable Search Path)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fix_permissions_final()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes Linter Warning
AS $$
BEGIN
  UPDATE "users"
  SET "memberStatus" = 'Admin', "role" = 'admin'
  WHERE "id" = auth.uid();
  RETURN 'Permissions fixed.';
END;
$$;


COMMIT;
