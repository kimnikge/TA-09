-- ПРОВЕРЯЕМ СТРУКТУРУ ТАБЛИЦЫ ORDERS
-- Выполните в Supabase SQL Editor

-- 1. Проверяем структуру таблицы orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Простая проверка - есть ли заказы вообще
SELECT COUNT(*) as orders_count FROM orders;

-- 3. Показываем все колонки первого заказа
SELECT * FROM orders LIMIT 1;
