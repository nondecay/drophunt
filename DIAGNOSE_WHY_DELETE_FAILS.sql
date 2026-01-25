-- DIAGNOSE WHY DELETE FAILS
-- "Silindi" diyor ama silinmiyor. Nedenini araştıran dedektif kodu.

-- 1. "Sessizce İptal Eden" Kurallar (RULES) var mı?
SELECT schemaname, tablename, rulename, definition
FROM pg_rules
WHERE tablename = 'comments';

-- 2. Tüm Tetikleyiciler (Triggers) ve Durumları
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement, 
    action_orientation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'comments';

-- 3. Yorumlara bağlı olup silmeyi engelleyen başka tablo var mı? (Foreign Keys)
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'comments';
