-- ПРОВЕРКА СУЩЕСТВУЮЩИХ ТАБЛИЦ
-- Выполните в Supabase SQL Editor для проверки структуры БД

-- 1. СПИСОК ВСЕХ ТАБЛИЦ В PUBLIC СХЕМЕ
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. СПИСОК ВСЕХ RLS ПОЛИТИК
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. СТАТУС RLS ДЛЯ ВСЕХ ТАБЛИЦ
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
