-- INSPECT ACTIVE POLICIES
-- Run this to see EXACTLY what policies are enforcing rules on 'events'.
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive, -- 'PERMISSIVE' (OR) vs 'RESTRICTIVE' (AND)
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'events';
