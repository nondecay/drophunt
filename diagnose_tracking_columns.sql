-- HATA TESPİTİ İÇİN (Lütfen bunu çalıştırıp sonucu bana verin)
-- 'users' tablosundaki 'track' ile ilgili sütunları listeleyelim.

SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'users' 
    AND column_name ILIKE '%track%';
