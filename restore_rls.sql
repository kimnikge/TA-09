-- ПОЛНОЕ ВОССТАНОВЛЕНИЕ RLS ПОЛИТИК
-- Выполните этот скрипт в Supabase Dashboard → SQL Editor

-- 1. ВРЕМЕННО ОТКЛЮЧАЕМ RLS ДЛЯ ИСПРАВЛЕНИЯ
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 2. УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ПОЛИТИКИ
-- Политики для profiles
DROP POLICY IF EXISTS "Allow all for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON profiles;
DROP POLICY IF EXISTS "Allow read access to all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow system to insert profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Политики для orders
DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Политики для order_items
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- 3. УСТАНАВЛИВАЕМ РОЛИ АДМИНОВ
UPDATE profiles 
SET role = 'admin', approved = true
WHERE email IN ('kimnikge@gmail.com', 'e.yugay.fregat@gmail.com');

-- 4. СОЗДАЕМ ПРОСТЫЕ И БЕЗОПАСНЫЕ ПОЛИТИКИ
-- Для profiles - разрешаем всё для аутентифицированных пользователей
CREATE POLICY "profiles_all_access" ON profiles
FOR ALL USING (auth.uid() IS NOT NULL);

-- Для orders - разрешаем всё для аутентифицированных пользователей
CREATE POLICY "orders_all_access" ON orders
FOR ALL USING (auth.uid() IS NOT NULL);

-- Для order_items - разрешаем всё для аутентифицированных пользователей
CREATE POLICY "order_items_all_access" ON order_items
FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. ВКЛЮЧАЕМ RLS ОБРАТНО
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 6. ПРОВЕРЯЕМ РЕЗУЛЬТАТ
SELECT 
    'РЕЗУЛЬТАТ ВОССТАНОВЛЕНИЯ:' as status,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_count;

-- Проверяем админов
SELECT 
    email,
    role,
    approved,
    'СТАТУС АДМИНА' as note
FROM profiles 
WHERE email IN ('kimnikge@gmail.com', 'e.yugay.fregat@gmail.com');

-- Проверяем все профили
SELECT 
    email,
    role,
    approved
FROM profiles 
ORDER BY created_at;
