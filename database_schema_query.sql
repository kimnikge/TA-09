-- Скрипт для получения информации о всех таблицах и их колонках
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Получаем список всех таблиц в схеме public
SELECT 
    'TABLE_LIST' as info_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Получаем структуру всех колонок для каждой таблицы
SELECT 
    'COLUMNS_INFO' as info_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. Получаем информацию о внешних ключах
SELECT 
    'FOREIGN_KEYS' as info_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. Получаем примеры данных из каждой таблицы (если есть)
-- Для clients
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        RAISE NOTICE 'SAMPLE_DATA: clients table exists';
        PERFORM 1; -- Замените на SELECT * FROM clients LIMIT 1; если хотите увидеть данные
    ELSE
        RAISE NOTICE 'SAMPLE_DATA: clients table does not exist';
    END IF;
END
$$;

-- Для products
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        RAISE NOTICE 'SAMPLE_DATA: products table exists';
    ELSE
        RAISE NOTICE 'SAMPLE_DATA: products table does not exist';
    END IF;
END
$$;

-- Для orders
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        RAISE NOTICE 'SAMPLE_DATA: orders table exists';
    ELSE
        RAISE NOTICE 'SAMPLE_DATA: orders table does not exist';
    END IF;
END
$$;

-- 5. Альтернативный способ - просто попробовать SELECT из основных таблиц
-- Раскомментируйте нужные строки:

-- SELECT 'clients_sample' as table_name, * FROM clients LIMIT 1;
-- SELECT 'products_sample' as table_name, * FROM products LIMIT 1;  
-- SELECT 'orders_sample' as table_name, * FROM orders LIMIT 1;
