-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ УСТРАНЕНИЯ ОШИБКИ 403
-- Дата: 31 июля 2025

-- ===== ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ PROFILES =====

-- Сначала удаляем старые политики, если они есть
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- ВКЛЮЧАЕМ RLS для таблицы profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Политика для просмотра собственного профиля
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
  );

-- 2. Политика для обновления собственного профиля (кроме поля approved)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  ) WITH CHECK (
    auth.uid() = id AND
    -- Пользователи НЕ могут изменять свой статус одобрения
    approved = OLD.approved
  );

-- 3. Политика для создания собственного профиля при регистрации
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- 4. Политика для администраторов - ПОЛНЫЙ доступ ко всем профилям
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Политика для администраторов - обновление всех профилей (включая approved)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===== ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ ORDERS =====

-- Удаляем старые политики orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- ВКЛЮЧАЕМ RLS для таблицы orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Политика для просмотра собственных заказов
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    created_by = auth.uid()
    OR 
    -- Администраторы видят все заказы
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Политика для создания заказов (только одобренные пользователи)
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND approved = true
    )
  );

-- 3. Политика для обновления собственных заказов
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND approved = true
    )
  ) WITH CHECK (
    created_by = auth.uid()
  );

-- 4. Политика для администраторов - полный доступ к заказам
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===== ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ CLIENTS =====

-- Удаляем старые политики clients
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;

-- ВКЛЮЧАЕМ RLS для таблицы clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 1. Политика для просмотра клиентов
CREATE POLICY "Users can view clients" ON clients
  FOR SELECT USING (
    created_by = auth.uid()
    OR 
    -- Администраторы видят всех клиентов
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Политика для создания клиентов (только одобренные пользователи)
CREATE POLICY "Users can create clients" ON clients
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND approved = true
    )
  );

-- 3. Политика для обновления клиентов
CREATE POLICY "Users can update clients" ON clients
  FOR UPDATE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND approved = true
    )
  ) WITH CHECK (
    created_by = auth.uid()
  );

-- ===== ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ PRODUCTS (если есть) =====

-- Удаляем старые политики products
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- ВКЛЮЧАЕМ RLS для таблицы products (если существует)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    
    -- Все могут просматривать товары
    CREATE POLICY "Anyone can view products" ON products
      FOR SELECT USING (true);
    
    -- Только администраторы могут управлять товарами
    CREATE POLICY "Admins can manage products" ON products
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ===== ПРОВЕРКА ПОЛИТИК =====

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
WHERE tablename IN ('profiles', 'orders', 'clients', 'products')
ORDER BY tablename, policyname;
