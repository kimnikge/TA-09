# 🔧 Исправление загрузки изображений товаров

## ❌ Проблема
В консоли браузера появляется ошибка: **"Bucket not found"** (404) при попытке загрузки изображений товаров.

## 🔍 Диагностика
- Проверен Supabase Storage: bucket `product-images` отсутствует
- Таблица `products` работает корректно
- Компонент `ImageUpload` готов к работе

## ✅ Решение
Необходимо создать bucket `product-images` в Supabase Dashboard:

### Шаг 1: Создание bucket через Dashboard
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел **Storage** (боковое меню)
4. Нажмите **Create a new bucket**
5. Заполните параметры:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Включить**
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
6. Нажмите **Create bucket**

### Шаг 2: Настройка политик доступа (автоматически)
После создания bucket политики доступа настроятся автоматически для публичного bucket.

### Шаг 3: Альтернативный способ - SQL скрипт
Если предпочитаете SQL, выполните в **SQL Editor**:

```sql
-- Выполните содержимое файла SETUP_STORAGE.sql
```

### Шаг 4: Проверка
После создания bucket запустите проверку:

```bash
cd frontend
npm run test-storage
```

Вы должны увидеть:
```
✅ Bucket product-images найден
📊 Информация о bucket: {...}
```

## 🎯 Ожидаемый результат
После создания bucket:
- Загрузка изображений товаров будет работать
- Ошибка "Bucket not found" исчезнет
- Изображения будут отображаться в каталоге

## 🔧 Команды для тестирования
```bash
# Проверка состояния Storage
npm run test-storage

# Создание bucket (может не работать из-за RLS)
npm run setup-storage

# Запуск приложения
npm run dev
```

## 🚨 ОБНОВЛЕНИЕ: Ошибка с правами доступа
Если вы получаете ошибку `ERROR: 42501: must be owner of table objects`, это означает, что у вас нет прав для создания политик через SQL.

### ✅ Упрощенное решение:
1. Создайте bucket `product-images` через Dashboard (как описано выше)
2. Установите его как **публичный** - этого достаточно для работы
3. Политики создавать не обязательно для публичного bucket

### 🔧 Альтернативный SQL (только для создания bucket):
```sql
-- Только создание bucket без политик
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

---
**Статус**: ⏳ Ожидает создания bucket в Supabase Dashboard
**Приоритет**: Высокий - блокирует загрузку изображений
**Обновлено**: 3 июля 2025 г. 20:12
