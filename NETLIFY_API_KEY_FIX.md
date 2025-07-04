# 🔧 Исправление ошибки "Invalid API key" на Netlify

## Проблема
После деплоя на Netlify появлялась ошибка "Invalid API key" и "401 Unauthorized", хотя локально все работало.

## Причина
Переменные окружения не передавались корректно в продакшн билд на Netlify.

## Внесенные исправления

### 1. Улучшен `supabaseClient.ts`
- Добавлена подробная диагностика подключения
- Улучшена проверка переменных окружения
- Добавлена проверка валидности ключей

### 2. Обновлен `vite.config.ts`
- Добавлены явные определения переменных окружения
- Улучшена совместимость с Netlify

### 3. Обновлен `netlify.toml`
- Добавлены переменные окружения в секцию build.environment
- Создан специальный скрипт сборки

### 4. Создан `build.sh`
- Скрипт для сборки с гарантированными переменными окружения
- Диагностика переменных перед сборкой

## Инструкции по деплою

### 1. Настройка переменных окружения в Netlify
Зайдите в панель управления Netlify:
1. Site settings → Environment variables
2. Добавьте переменные:
   - `VITE_SUPABASE_URL` = `https://olutrxiazrmanrgzzwmb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM`

### 2. Деплой
```bash
git add .
git commit -m "Исправление ошибки API key для Netlify"
git push origin main
```

### 3. Проверка
После деплоя проверьте:
- `https://your-site.netlify.app/debug.html` - диагностическая страница
- `https://your-site.netlify.app/test.html` - тестовая страница
- Основное приложение - должно работать без ошибок

## Диагностика

### Если ошибка повторяется:
1. Проверьте консоль браузера (F12)
2. Откройте `/debug.html` для диагностики
3. Убедитесь, что переменные окружения настроены в Netlify
4. Проверьте логи сборки в Netlify

### Проверка переменных окружения:
В консоли браузера должны быть логи:
```
🔧 Настройка Supabase клиента...
📍 Supabase URL: https://olutrxiazrmanrgzzwmb.supabase.co
🔑 Anon Key (первые 20 символов): eyJhbGciOiJIUzI1NiIsInR5...
🔑 Anon Key length: 207
✅ Supabase подключен успешно
```

## Резервное решение

Если проблема повторяется, можно использовать альтернативный подход:
1. Создать файл `src/config.ts` с хардкодом констант
2. Импортировать его вместо переменных окружения
3. Это менее безопасно, но гарантированно работает

---

*Исправления внесены: 4 июля 2025 г.*
