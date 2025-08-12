-- ДОПОЛНИТЕЛЬНОЕ ИСПРАВЛЕНИЕ ДЛЯ ЗАКАЗОВ
-- Выполните в Supabase SQL Editor если заказы не загружаются

-- 1. ПРОВЕРЯЕМ ЕСТЬ ЛИ ТАБЛИЦА CLIENTS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'clients';

-- 2. ЕСЛИ ЕСТЬ - ДОБАВЛЯЕМ ПОЛИТИКУ ДЛЯ CLIENTS
DO $$
BEGIN
    -- Проверяем существование таблицы clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        -- Отключаем RLS для clients
        ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
        
        -- Удаляем старые политики
        DROP POLICY IF EXISTS "clients_public_access" ON clients;
        
        -- Создаем новую политику
        CREATE POLICY "clients_public_access" ON clients FOR ALL USING (true);
        
        -- Включаем RLS обратно
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Политика для clients создана';
    ELSE
        RAISE NOTICE 'Таблица clients не найдена';
    END IF;
END $$;

-- 3. ПРОВЕРЯЕМ КОЛИЧЕСТВО ЗАКАЗОВ
SELECT 
    'ЗАКАЗЫ' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
FROM orders;

-- 4. ПРОВЕРЯЕМ ОБРАЗЕЦ ЗАКАЗА
SELECT 
    id,
    client_id,
    rep_id,
    status,
    created_at,
    'ОБРАЗЕЦ ЗАКАЗА' as note
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;
