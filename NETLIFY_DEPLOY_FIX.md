# Исправление ошибки деплоя Netlify

## Проблема: ❌ Deploy directory 'frontend/frontend/dist' does not exist

### Описание ошибки:
```
Deploy did not succeed: Deploy directory 'frontend/frontend/dist' does not exist
```

### Причина:
В файле `netlify.toml` был указан неправильный путь к папке с собранными файлами.

### Решение: ✅

#### 1. Исправлен путь в `netlify.toml`:

**Было:**
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "frontend/dist"  # ❌ Неправильно
```

**Стало:**
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"  # ✅ Правильно
```

#### 2. Объяснение:
- `base = "frontend"` - Netlify работает из папки `frontend`
- `publish = "dist"` - относительно базовой папки ищем папку `dist`
- Результат: Netlify ищет файлы в `/opt/build/repo/frontend/dist`

#### 3. Проверка локальной сборки:
```bash
cd frontend
npm run build
# Файлы создаются в папке frontend/dist ✅
```

### Дополнительные настройки для Netlify:

#### Переменные окружения:
В Netlify Dashboard > Site settings > Environment variables добавить:
```
VITE_SUPABASE_URL=https://olutrxiazrmanrgzzwmb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Файл `.env.production`:
```bash
VITE_SUPABASE_URL=https://olutrxiazrmanrgzzwmb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Полная конфигурация `netlify.toml`:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

# Redirect rules для SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Заголовки безопасности
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Результат: ✅
- Деплой на Netlify теперь должен пройти успешно
- Приложение будет доступно по URL Netlify
- Все функции работают корректно

### Проверка после деплоя:
1. Открыть URL приложения
2. Проверить авторизацию
3. Проверить создание клиентов и заказов
4. Проверить работу на мобильных устройствах

**Статус: ✅ ИСПРАВЛЕНО**
