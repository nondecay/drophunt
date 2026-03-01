-- DIAGNOSE PERSISTENCE ISSUES
-- Run this in Supabase SQL Editor to see the table structure.

-- 1. Show Columns and Types
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY column_name;

-- 2. Show Active RLS Policies on Users
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Show Triggers (in case something blocks updates)
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users';
