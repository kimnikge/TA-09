-- СУПЕР ПРОСТАЯ ПРОВЕРКА ТАБЛИЦ
-- Выполните каждый запрос по очереди в Supabase SQL Editor

-- 1. Какие таблицы есть в базе?
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Колонки таблицы clients
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';

-- 3. Колонки таблицы products  
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';

-- 4. Колонки таблицы orders
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders';

-- 5. Проверяем торговых представителей (возможные таблицы)
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reps';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'representatives';

-- 6. Пример данных (раскомментируйте нужное):
-- SELECT * FROM clients LIMIT 1;
-- SELECT * FROM products LIMIT 1;
-- SELECT * FROM orders LIMIT 1;
-- SELECT * FROM users LIMIT 1;
