-- Быстрая проверка основных таблиц
-- Скопируйте и выполните этот код в Supabase SQL Editor

-- Проверяем какие таблицы существуют
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Проверяем структуру таблицы clients (если существует)
\d+ clients

-- Проверяем структуру таблицы products (если существует)  
\d+ products

-- Проверяем структуру таблицы orders (если существует)
\d+ orders

-- Получаем колонки для clients
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Получаем колонки для products
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Получаем колонки для orders
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
