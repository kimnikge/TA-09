-- SQL скрипт для проверки и исправления политик RLS для таблицы products
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase

-- 1. Проверяем текущие политики для таблицы products
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 2. Включаем RLS для таблицы products (если не включен)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Allow admin to manage products" ON public.products;
DROP POLICY IF EXISTS "Allow users to view products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to view products" ON public.products;
DROP POLICY IF EXISTS "Allow admin to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow admin to update products" ON public.products;
DROP POLICY IF EXISTS "Allow admin to delete products" ON public.products;

-- 4. Создаем политики для чтения (все аутентифицированные пользователи)
CREATE POLICY "Allow authenticated users to view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Создаем политики для создания товаров (только админы)
CREATE POLICY "Allow admin to insert products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Создаем политики для обновления товаров (только админы)
CREATE POLICY "Allow admin to update products" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Создаем политики для удаления товаров (только админы)
CREATE POLICY "Allow admin to delete products" ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Проверяем созданные политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 9. Проверяем структуру таблицы products
\d products;

-- 10. Проверяем связи с другими таблицами (foreign keys)
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name='products' OR ccu.table_name='products');
