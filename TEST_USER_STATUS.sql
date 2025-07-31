-- Тестовый SQL для проверки обновления статуса пользователей
-- Выполните этот скрипт в SQL Editor Supabase для мониторинга изменений

-- 1. Показать текущее состояние всех пользователей
SELECT 
    id, 
    email, 
    name, 
    role, 
    approved,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY email;

-- 2. Включить логирование изменений (если нужно)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Проверить права доступа
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 4. Мониторинг изменений в режиме реального времени
-- (выполните этот запрос и оставьте открытым, затем измените статус в админ-панели)
SELECT 
    id,
    email,
    approved,
    updated_at,
    CASE 
        WHEN approved = true THEN '✅ Активен'
        ELSE '❌ Заблокирован'
    END as status_display
FROM public.profiles 
ORDER BY updated_at DESC
LIMIT 10;
