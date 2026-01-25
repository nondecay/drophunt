-- FIX: SPECIFIC MISSING FUNCTION
-- The error is: function public.is_admin_safe(uuid) does not exist.
-- This creates EXACTLY that function.

CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND (role = 'admin' OR "memberStatus" IN ('Admin', 'Super Admin', 'Moderator'))
  );
$$;

-- Grant permissions to make sure it's callable
GRANT EXECUTE ON FUNCTION public.is_admin_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe(UUID) TO anon;
