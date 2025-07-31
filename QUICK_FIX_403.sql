-- БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ 403 - УПРОЩЕННЫЕ RLS ПОЛИТИКИ
-- Дата: 31 июля 2025

-- ===== ВРЕМЕННОЕ РЕШЕНИЕ: БОЛЕЕ ОТКРЫТЫЕ ПОЛИТИКИ =====

-- Удаляем все существующие политики для profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- ВКЛЮЧАЕМ RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- УПРОЩЕННАЯ ПОЛИТИКА: Аутентифицированные пользователи могут читать все профили
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- УПРОЩЕННАЯ ПОЛИТИКА: Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- УПРОЩЕННАЯ ПОЛИТИКА: Пользователи могут создавать свой профиль
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- АДМИНЫ могут все
CREATE POLICY "Admins full access to profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===== ПОЛИТИКИ ДЛЯ ORDERS =====

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Простая политика для заказов
CREATE POLICY "Authenticated users can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- ===== ПОЛИТИКИ ДЛЯ CLIENTS =====

DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Простая политика для клиентов
CREATE POLICY "Authenticated users can manage clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Проверяем результат
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'orders', 'clients')
ORDER BY tablename;
