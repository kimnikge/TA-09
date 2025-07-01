-- Удаление столбцов company, seller, phone и email из таблицы clients
-- Эти поля были заменены на более простую структуру с только name и address как обязательными полями

-- Удаляем столбцы company, seller, phone и email
ALTER TABLE clients DROP COLUMN IF EXISTS company;
ALTER TABLE clients DROP COLUMN IF EXISTS seller;
ALTER TABLE clients DROP COLUMN IF EXISTS phone;
ALTER TABLE clients DROP COLUMN IF EXISTS email;

-- Проверяем структуру таблицы после изменений
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Показываем количество записей в таблице
SELECT COUNT(*) as total_clients FROM clients;

-- Показываем первые 5 записей для проверки (только оставшиеся поля)
SELECT id, name, address, created_by, created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;
LIMIT 5;
