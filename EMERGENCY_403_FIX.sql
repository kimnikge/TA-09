-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ОШИБКИ 403
-- Применить немедленно в Supabase Dashboard > SQL Editor

-- ВРЕМЕННО отключаем RLS для отладки
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- После отладки включить обратно:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
