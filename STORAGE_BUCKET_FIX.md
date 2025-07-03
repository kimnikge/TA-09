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

---
**Статус**: ⏳ Ожидает создания bucket в Supabase Dashboard
**Приоритет**: Высокий - блокирует загрузку изображений
