-- Check Comments Table Schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments';

-- Check User Count
SELECT count(*) FROM public.users;
