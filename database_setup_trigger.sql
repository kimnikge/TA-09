-- SQL скрипт для автоматического создания профилей
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase

-- 1. Создаем функцию для создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, approved, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'sales_rep',
    false,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Создаем триггер, который срабатывает при создании нового пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Настраиваем политики RLS для profiles (если нужно)

-- Разрешить пользователям читать все профили
DROP POLICY IF EXISTS "Allow read access to all profiles" ON public.profiles;
CREATE POLICY "Allow read access to all profiles" ON public.profiles
  FOR SELECT USING (true);

-- Разрешить пользователям обновлять свой собственный профиль
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Разрешить системе создавать профили (для триггера)
DROP POLICY IF EXISTS "Allow system to insert profiles" ON public.profiles;
CREATE POLICY "Allow system to insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 4. Включаем RLS если он не включен
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Комментарий с инструкциями
COMMENT ON FUNCTION public.handle_new_user() IS 
'Автоматически создает профиль в таблице profiles при регистрации нового пользователя в auth.users';

-- Проверяем, что триггер создан
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
