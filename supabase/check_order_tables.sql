-- ПРОВЕРЯЕМ ВСЕ ТАБЛИЦЫ ДЛЯ ЗАКАЗОВ
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'clients', 'products')
ORDER BY table_name, ordinal_position;
