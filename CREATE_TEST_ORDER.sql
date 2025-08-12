-- СОЗДАЕМ ТЕСТОВЫЕ ДАННЫЕ ДЛЯ ПРОВЕРКИ ЗАКАЗОВ
-- Выполните в Supabase SQL Editor

-- 1. Создаем тестового клиента (если нет)
INSERT INTO clients (id, name, address, phone, email, created_at)
VALUES (
  gen_random_uuid(),
  'Тестовый клиент для проверки',
  'ул. Тестовая, д. 1',
  '+7 999 999 99 99',
  'test@example.com',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Получаем ID клиента и админа
SELECT 
    'КЛИЕНТ:' as type,
    id,
    name
FROM clients 
WHERE name = 'Тестовый клиент для проверки'
LIMIT 1;

SELECT 
    'АДМИН:' as type,
    id,
    name,
    role
FROM profiles 
WHERE role = 'admin'
LIMIT 1;

-- 3. Создаем тестовый заказ (замените client_id и rep_id на реальные)
INSERT INTO orders (
    id,
    client_id,
    rep_id,
    delivery_date,
    total_items,
    total_price,
    created_at
) 
SELECT 
    gen_random_uuid(),
    c.id,
    p.id,
    (NOW() + INTERVAL '3 days')::date,
    2,
    1500.00,
    NOW()
FROM clients c, profiles p
WHERE c.name = 'Тестовый клиент для проверки'
AND p.role = 'admin'
LIMIT 1;

-- 4. Проверяем что заказ создался
SELECT 
    'ТЕСТОВЫЙ ЗАКАЗ:' as type,
    o.id,
    o.total_price,
    o.created_at,
    c.name as client_name,
    p.name as manager_name
FROM orders o
JOIN clients c ON o.client_id = c.id
JOIN profiles p ON o.rep_id = p.id
WHERE c.name = 'Тестовый клиент для проверки'
ORDER BY o.created_at DESC
LIMIT 1;
