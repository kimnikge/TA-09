-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: ПОЛНОЕ ОТКЛЮЧЕНИЕ RLS
-- Выполните в Supabase SQL Editor НЕМЕДЛЕННО

-- 1. ОТКЛЮЧАЕМ RLS ДЛЯ ВСЕХ ТАБЛИЦ
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY; 
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 2. УДАЛЯЕМ ВСЕ ПОЛИТИКИ
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Удаляем все политики для всех таблиц
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. ПРОВЕРЯЕМ ДАННЫЕ
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'PRODUCTS' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'ORDERS' as table_name, COUNT(*) as count FROM orders;

-- 4. ПРОВЕРЯЕМ КОНКРЕТНО ВАШ ПРОФИЛЬ
SELECT * FROM profiles WHERE email = 'kimnikge@gmail.com';

-- 5. ЕСЛИ ПРОФИЛЯ НЕТ - СОЗДАЕМ
INSERT INTO profiles (id, email, role, approved, created_at) 
SELECT 
    auth.uid(),
    'kimnikge@gmail.com',
    'admin',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'kimnikge@gmail.com'
);

-- 6. ПРИНУДИТЕЛЬНО ОБНОВЛЯЕМ РОЛЬ
UPDATE profiles 
SET role = 'admin', approved = true 
WHERE email = 'kimnikge@gmail.com';

-- 7. ФИНАЛЬНАЯ ПРОВЕРКА
SELECT 
    'ИСПРАВЛЕНИЕ ЗАВЕРШЕНО' as status,
    email,
    role,
    approved
FROM profiles 
WHERE email = 'kimnikge@gmail.com';
