# Обновление структуры базы данных

## Изменения в таблице clients

Были удалены следующие столбцы:
- `company` - название компании/ТОО
- `seller` - имя продавца/контактного лица

Оставлены только обязательные поля:
- `name` - название магазина/торговой точки (обязательное)
- `address` - адрес точки (обязательное)
- `phone` - телефон (необязательное)
- `email` - email (необязательное)

## Как выполнить обновление

### 1. Проверить текущую структуру таблицы
```sql
-- Выполните в Supabase SQL Editor
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;
```

### 2. Удалить ненужные столбцы
```sql
-- Удаляем столбцы company и seller
ALTER TABLE clients DROP COLUMN IF EXISTS company;
ALTER TABLE clients DROP COLUMN IF EXISTS seller;
```

### 3. Проверить результат
```sql
-- Проверяем структуру после изменений
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Проверяем данные
SELECT id, name, address, phone, email, created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;
```

## Что изменилось в коде

### Frontend компоненты
- `ClientsManager.tsx` - упрощена форма добавления точки
- Удалены поля "Название компании" и "Контактное лицо"
- Обновлен интерфейс `Client` - убраны `company_name` и `seller_name`

### Тестовые скрипты
- `testAddNewClient.ts` - обновлен для работы с новой структурой
- Убраны ссылки на удаленные поля

## Проверка работоспособности

После выполнения изменений в БД:

1. Запустите сервер разработки: `npm run dev`
2. Откройте страницу "Клиенты" в админ-панели
3. Попробуйте добавить новую торговую точку
4. Проверьте, что форма содержит только поля "Название магазина" и "Адрес точки" как обязательные

Телефон и email остаются как необязательные поля для удобства контакта.
