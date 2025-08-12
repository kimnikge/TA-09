-- БЫСТРАЯ ДИАГНОСТИКА ЗАКАЗОВ
-- Выполните в Supabase SQL Editor

-- 1. Проверяем количество заказов
SELECT 
    'ОБЩИЙ СЧЕТ ЗАКАЗОВ' as info,
    COUNT(*) as count
FROM orders;

-- 2. Проверяем последние заказы
SELECT 
    'ПОСЛЕДНИЕ ЗАКАЗЫ' as info,
    id,
    client_id,
    rep_id,
    status,
    total_price,
    created_at::date as date_created
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 3. Проверяем есть ли клиенты
SELECT 
    'КЛИЕНТЫ' as info,
    COUNT(*) as count
FROM clients;

-- 4. Проверяем есть ли профили менеджеров  
SELECT 
    'ПРОФИЛИ МЕНЕДЖЕРОВ' as info,
    COUNT(*) as count
FROM profiles;

-- 5. Проверяем политики RLS
SELECT 
    'RLS ПОЛИТИКИ' as info,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'clients', 'profiles', 'order_items')
ORDER BY tablename;
