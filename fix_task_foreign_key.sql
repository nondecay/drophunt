-- Remove the foreign key constraint that prevents custom airdrop IDs
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS "todos_airdropId_fkey";

-- Also ensure RLS is correct while we are here (just in case)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.todos TO anon, authenticated, service_role;
