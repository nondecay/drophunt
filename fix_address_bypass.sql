-- FIX ADDRESS BYPASS
-- As requested, this policy grants access strictly based on the Wallet Address.
-- It ignores the 'role' column (which might have formatting issues) and checks the specific address.

-- Admin Wallet: 0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1

ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Clean up
DROP POLICY IF EXISTS "Admins_Insert_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Strict" ON public.events;
DROP POLICY IF EXISTS "Admins_Insert_Hardcoded" ON public.events;
DROP POLICY IF EXISTS "Admins_Update_Hardcoded" ON public.events;
DROP POLICY IF EXISTS "Admins_Delete_Hardcoded" ON public.events;
DROP POLICY IF EXISTS "Allow_Specific_Wallet" ON public.events;

-- READ: Everyone
DROP POLICY IF EXISTS "Public_Read_Strict" ON public.events;
CREATE POLICY "Public_Read_Strict" ON public.events FOR SELECT USING (true);

-- WRITE Policy (Specific Wallet Address)
CREATE POLICY "Admin_Wallet_Insert"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE address = '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1' -- The verified Admin Address
    AND id::text = auth.uid()::text -- Match the Auth Session
  )
);

CREATE POLICY "Admin_Wallet_Update"
ON public.events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE address = '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
    AND id::text = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE address = '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
    AND id::text = auth.uid()::text
  )
);

CREATE POLICY "Admin_Wallet_Delete"
ON public.events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE address = '0x9126a02fbc8f41cfa7a6ce73920eda6c04724bc1'
    AND id::text = auth.uid()::text
  )
);
