-- DEBUG AUTH & RLS
-- Run this in Supabase SQL Editor to see if your current session matches the admin criteria.

SELECT 
  auth.uid() as auth_id, 
  (SELECT id FROM public.users WHERE id::text = auth.uid()::text) as matched_user_id,
  (SELECT role FROM public.users WHERE id::text = auth.uid()::text) as user_role,
  (SELECT "memberStatus" FROM public.users WHERE id::text = auth.uid()::text) as member_status,
  public.get_is_admin() as is_admin_check_result;
