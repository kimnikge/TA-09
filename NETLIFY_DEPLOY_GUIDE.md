# 🚀 Деплой на Netlify - Инструкция

## 📋 Подготовка к деплою

### 1. Подготовка репозитория
```bash
# Убедитесь, что все изменения зафиксированы
git add .
git commit -m "🚀 Подготовка к деплою на Netlify"
git push origin main
```

### 2. Настройка Netlify

1. **Войдите в Netlify:** https://app.netlify.com/
2. **Создайте новый сайт:**
   - Нажмите "Add new site" > "Import an existing project"
   - Выберите GitHub/GitLab/Bitbucket
   - Найдите ваш репозиторий `TA-09`

3. **Настройки сборки:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

### 3. Переменные окружения в Netlify

Добавьте в **Site settings > Environment variables:**

```
VITE_SUPABASE_URL=https://olutrxiazrmanrgzzwmb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM
```

### 4. Настройка домена (опционально)

1. **Бесплатный поддомен:** 
   - Netlify автоматически создаст URL типа `https://your-app-name.netlify.app`

2. **Кастомный домен:**
   - Site settings > Domain management
   - Добавьте ваш домен
   - Настройте DNS записи

## 📱 Тестирование мобильной версии

### Доступ к приложению:

1. **Локальная разработка:**
   - `http://localhost:5173/` - с компьютера
   - `http://192.168.10.6:5173/` - с мобильного устройства в той же сети

2. **После деплоя:**
   - `https://your-app-name.netlify.app` - доступно отовсюду

### Проверка на мобильных устройствах:

1. **iOS (Safari):**
   - Откройте URL в Safari
   - Нажмите "Поделиться" > "На экран «Домой»"
   - Приложение установится как PWA

2. **Android (Chrome):**
   - Откройте URL в Chrome
   - Появится уведомление "Добавить на главный экран"
   - Приложение установится как PWA

## 🔧 Решение проблем с мобильными устройствами

### Если приложение не загружается на мобильном:

1. **Проверьте сеть:**
   ```bash
   # Убедитесь, что мобильное устройство в той же сети
   ping 192.168.10.6
   ```

2. **Проверьте файрволл:**
   ```bash
   # macOS - разрешите подключения на порт 5173
   sudo pfctl -f /etc/pf.conf
   ```

3. **Используйте HTTPS:**
   - Для production используйте Netlify URL (автоматически HTTPS)
   - Для локальной разработки можно использовать ngrok

### Использование ngrok для тестирования:

```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель
ngrok http 5173
```

## 🎯 Результат

После успешного деплоя:

- ✅ Приложение доступно по HTTPS URL
- ✅ Работает на всех мобильных устройствах
- ✅ PWA поддержка (можно установить на главный экран)
- ✅ Автоматическое обновление при изменениях в репозитории
- ✅ Оптимизированная сборка для производства

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи сборки в Netlify
2. Убедитесь, что все переменные окружения установлены
3. Проверьте консоль браузера на наличие ошибок
