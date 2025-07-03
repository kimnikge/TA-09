-- SQL скрипт для исправления политик RLS
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase

-- 1. Удаляем старую политику обновления
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

-- 2. Создаем новую политику: пользователи могут обновлять свой профиль ИЛИ админы могут обновлять любые профили
CREATE POLICY "Allow profile updates" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR  -- Пользователь обновляет свой профиль
    EXISTS (  -- ИЛИ пользователь является администратором
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Также добавляем политику для удаления (только для админов)
DROP POLICY IF EXISTS "Allow admin to delete profiles" ON public.profiles;
CREATE POLICY "Allow admin to delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Проверяем текущие политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
