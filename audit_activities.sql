-- AUDIT ACTIVITIES RLS
-- Checking policies for tables related to Daily GM, Mint, Deploy, RPG

SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('user_activities', 'users', 'daily_claims', 'quests'); -- Guessing table names based on context due to lack of full schema visibility yet
