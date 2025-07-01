-- Удаление столбцов company и seller из таблицы clients
-- Эти поля были заменены на более простую структуру с только name и address как обязательными полями

-- Удаляем столбцы company и seller
ALTER TABLE clients DROP COLUMN IF EXISTS company;
ALTER TABLE clients DROP COLUMN IF EXISTS seller;

-- Проверяем структуру таблицы после изменений
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Показываем количество записей в таблице
SELECT COUNT(*) as total_clients FROM clients;

-- Показываем первые 5 записей для проверки
SELECT id, name, address, phone, email, created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;
