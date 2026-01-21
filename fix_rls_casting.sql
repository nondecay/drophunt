-- FIX RLS TYPE CASTING
-- It's possible that auth.uid() (UUID) and users.id (Text or UUID) are consistently failing comparison.
-- We will force both to text to be safe.

CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      -- Whitelist emails
      coalesce(auth.jwt() ->> 'email', '') IN ('admin@drophunt.xyz', 'super@drophunt.xyz')
    )
    OR
    (
      -- Database Role Check with Explicit Casting
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id::text = auth.uid()::text 
        AND (role = 'admin' OR "memberStatus" = 'Admin')
      )
    );
$$;

-- Grant execution again to be sure
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO anon;

-- Verification Query (Optional - Run to see if it returns true for your current user)
-- SELECT public.is_admin_safe(); 
