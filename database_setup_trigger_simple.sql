-- УПРОЩЕННЫЙ SQL СКРИПТ ДЛЯ SUPABASE
-- Скопируйте и выполните этот код в SQL Editor Supabase

-- 1. Создаем функцию для автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'sales_rep',
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Игнорируем ошибку, если профиль уже существует
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Создаем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Обновляем политики RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политика для чтения всех профилей
DROP POLICY IF EXISTS "Allow read access to all profiles" ON public.profiles;
CREATE POLICY "Allow read access to all profiles" ON public.profiles
  FOR SELECT USING (true);

-- Политика для обновления собственного профиля
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Политика для создания профилей (для триггера)
DROP POLICY IF EXISTS "Allow system to insert profiles" ON public.profiles;
CREATE POLICY "Allow system to insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 4. Проверяем результат
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
