-- Добавляем поле approved в таблицу profiles, если его нет
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase

-- Проверяем и добавляем поле approved, если его нет
DO $$
BEGIN
    -- Проверяем, существует ли поле approved
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'approved' 
        AND table_schema = 'public'
    ) THEN
        -- Добавляем поле approved со значением по умолчанию true (для совместимости со старыми записями)
        ALTER TABLE public.profiles ADD COLUMN approved BOOLEAN DEFAULT true;
        
        -- Обновляем политики RLS для нового поля
        GRANT SELECT (approved) ON public.profiles TO authenticated;
        GRANT UPDATE (approved) ON public.profiles TO authenticated;
        
        RAISE NOTICE 'Поле approved добавлено в таблицу profiles';
    ELSE
        RAISE NOTICE 'Поле approved уже существует в таблице profiles';
    END IF;
END $$;

-- Убеждаемся, что у админов есть права на обновление статуса approved
GRANT UPDATE ON public.profiles TO authenticated;

-- Показываем структуру таблицы для проверки
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
