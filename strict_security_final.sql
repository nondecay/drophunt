-- STRICT SECURITY FINAL FIX
-- Corrects column names based on deep investigation:
-- TODOS: "userId"
-- USER_CLAIMS: user_id
-- COMMENTS: address (fallback)

-- 1. USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Update_Self" ON public.users;
DROP POLICY IF EXISTS "Strict_Insert_Self" ON public.users;
CREATE POLICY "Strict_Update_Self" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Strict_Insert_Self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. TODOS (Tasks) - Uses "userId"
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Update_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Delete_Todos" ON public.todos;
DROP POLICY IF EXISTS "Strict_Insert_Todos" ON public.todos;

CREATE POLICY "Strict_Select_Todos" ON public.todos FOR SELECT USING (true);
CREATE POLICY "Strict_Insert_Todos" ON public.todos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Strict_Update_Todos" ON public.todos FOR UPDATE USING (auth.uid()::text = "userId"::text OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Strict_Delete_Todos" ON public.todos FOR DELETE USING (auth.uid()::text = "userId"::text OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- 3. USER CLAIMS - Uses user_id
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Insert_Claims" ON public.user_claims;
DROP POLICY IF EXISTS "Strict_Update_Claims" ON public.user_claims;

CREATE POLICY "Strict_Select_Claims" ON public.user_claims FOR SELECT USING (true);
CREATE POLICY "Strict_Insert_Claims" ON public.user_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Strict_Update_Claims" ON public.user_claims FOR UPDATE USING (auth.uid() = user_id); 


-- 4. COMMENTS - Uses address (Safest bet based on history)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict_Insert_Comments" ON public.comments;
DROP POLICY IF EXISTS "Strict_Delete_Comments" ON public.comments;

CREATE POLICY "Strict_Select_Comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Strict_Insert_Comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Using address link for deletion
CREATE POLICY "Strict_Delete_Comments" ON public.comments FOR DELETE USING (
  address = (SELECT address FROM public.users WHERE id = auth.uid()) 
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
