-- ПОЛНАЯ ПРОВЕРКА И ИСПРАВЛЕНИЕ ЗАКАЗОВ
-- Выполните в Supabase SQL Editor

-- 1. ПРОВЕРЯЕМ ВСЕ ТАБЛИЦЫ ЗАКАЗОВ
SELECT 
    'ТАБЛИЦЫ:' as info,
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ) THEN 'СУЩЕСТВУЕТ'
        ELSE 'НЕ НАЙДЕНА'
    END as status
FROM (
    VALUES 
        ('orders'),
        ('order_items'), 
        ('clients'),
        ('products'),
        ('profiles')
) AS t(table_name);

-- 2. ПРОВЕРЯЕМ RLS ПОЛИТИКИ
SELECT 
    'RLS ПОЛИТИКИ:' as info,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'ALL' THEN 'ВСЕ ОПЕРАЦИИ'
        WHEN cmd = 'SELECT' THEN 'ЧТЕНИЕ'
        WHEN cmd = 'INSERT' THEN 'ВСТАВКА'
        WHEN cmd = 'UPDATE' THEN 'ОБНОВЛЕНИЕ'
        WHEN cmd = 'DELETE' THEN 'УДАЛЕНИЕ'
    END as operations
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items', 'clients', 'products', 'profiles')
ORDER BY tablename, policyname;

-- 3. ИСПРАВЛЯЕМ ВСЕ ПОЛИТИКИ ДЛЯ АДМИНА
-- Заказы
DROP POLICY IF EXISTS "orders_admin_access" ON orders;
CREATE POLICY "orders_admin_access" ON orders FOR ALL USING (true);

-- Позиции заказов  
DROP POLICY IF EXISTS "order_items_admin_access" ON order_items;
CREATE POLICY "order_items_admin_access" ON order_items FOR ALL USING (true);

-- Клиенты
DROP POLICY IF EXISTS "clients_admin_access" ON clients;
CREATE POLICY "clients_admin_access" ON clients FOR ALL USING (true);

-- Продукты
DROP POLICY IF EXISTS "products_admin_access" ON products;
CREATE POLICY "products_admin_access" ON products FOR ALL USING (true);

-- 4. ВКЛЮЧАЕМ RLS ДЛЯ ВСЕХ ТАБЛИЦ
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. ПРОВЕРЯЕМ КОЛИЧЕСТВО ЗАПИСЕЙ
SELECT 'ЗАКАЗЫ' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'ПОЗИЦИИ ЗАКАЗОВ' as table_name, COUNT(*) as count FROM order_items
UNION ALL  
SELECT 'КЛИЕНТЫ' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'ПРОДУКТЫ' as table_name, COUNT(*) as count FROM products;

-- 6. ПОКАЗЫВАЕМ ОБРАЗЕЦ ЗАКАЗА С ДЕТАЛЯМИ
SELECT 
    o.id as order_id,
    o.created_at,
    o.total_price,
    c.name as client_name,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN clients c ON o.client_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.created_at, o.total_price, c.name
ORDER BY o.created_at DESC
LIMIT 3;
