-- Скрипт для диагностики и исправления проблем с удалением товаров
-- Выполните этот скрипт по частям в SQL Editor Supabase

-- 1. Проверяем текущего пользователя и его роль
SELECT 
  auth.uid() as current_user_id,
  p.role as user_role,
  p.name as user_name,
  p.email as user_email
FROM profiles p 
WHERE p.id = auth.uid();

-- 2. Проверяем структуру таблицы products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем внешние ключи на таблицу products
SELECT 
    tc.table_name as referencing_table, 
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'products';

-- 4. Проверяем, есть ли товары, которые используются в заказах
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(oi.id) as orders_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name
HAVING COUNT(oi.id) > 0
ORDER BY orders_count DESC;

-- 5. Проверяем текущие политики RLS для products
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY cmd, policyname;

-- 6. Тестируем права на удаление (безопасная проверка)
-- Создаем тестовый товар
INSERT INTO products (name, price, unit, category, active) 
VALUES ('TEST_PRODUCT_DELETE', 1, 'шт', 'TEST', true)
RETURNING id, name;

-- Попытка удаления тестового товара (замените UUID на реальный)
-- DELETE FROM products WHERE name = 'TEST_PRODUCT_DELETE';

-- 7. Показываем все товары для тестирования
SELECT id, name, price, unit, category, active, image_url
FROM products 
ORDER BY name
LIMIT 10;
