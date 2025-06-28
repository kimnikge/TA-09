# Обновление структуры базы данных

## ❗ Важно
Структура таблиц в БД не соответствует ожидаемой схеме. Необходимо обновить таблицу `profiles`.

## 🔧 Инструкции по обновлению

### 1. Откройте Supabase Dashboard
- Перейдите на https://supabase.com
- Войдите в свой проект: `olutrxiazrmanrgzzwmb`

### 2. Выполните SQL команды
- Перейдите в раздел **SQL Editor**
- Скопируйте и выполните содержимое файла `UPDATE_DATABASE.sql`
- Или выполните команды по частям:

```sql
-- Минимальное обновление для работы приложения
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'sales_rep')) DEFAULT 'sales_rep',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### 3. Проверьте результат
Запустите проверочный скрипт:
```bash
cd frontend
npm run check-db
```

## 📊 Текущее состояние БД

**Таблица profiles:**
- ✅ Существует
- ❌ Отсутствуют колонки: `email`, `name`, `role`, `updated_at`
- 📝 Найдена 1 запись с неполными данными

**Остальные таблицы:**
- ✅ clients - существует
- ✅ products - существует (6 товаров)
- ✅ orders - существует
- ✅ order_items - существует

## 🎯 После обновления БД

1. **Регистрация админа:**
   ```bash
   cd frontend
   npx tsx scripts/testRegistration.ts
   ```

2. **Запуск приложения:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Тестирование:**
   - Email: `test.admin@gmail.com`
   - Пароль: `admin123`

## 🔍 Диагностика

Если возникают проблемы, запустите диагностические скрипты:
```bash
npx tsx scripts/checkDatabase.ts
npx tsx scripts/checkTableStructure.ts
```
