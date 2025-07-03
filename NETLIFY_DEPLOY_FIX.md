# 🔄 Netlify Auto-Deploy Troubleshooting Guide

## Возможные причины почему Netlify не подхватывает изменения:

### 1. **Проблемы с GitHub интеграцией**
- Netlify не подключен к правильному репозиторию
- Веб-хуки GitHub не настроены
- Права доступа к репозиторию недостаточные

### 2. **Проблемы с настройками деплоя**
- Неправильная команда сборки
- Неправильная папка публикации
- Ошибки в процессе сборки

### 3. **Проблемы с ветками**
- Деплой настроен не на ту ветку
- Автодеплой отключен для вашей ветки

## 🛠️ Пошаговое решение:

### Шаг 1: Проверьте настройки сайта в Netlify
1. Зайдите в Netlify Dashboard
2. Выберите ваш сайт
3. Перейдите в **Site settings** → **Build & deploy**
4. Проверьте:
   - **Repository:** должен быть kimnikge/TA-09
   - **Branch:** должна быть main
   - **Build command:** `cd frontend && npm run build`
   - **Publish directory:** `frontend/dist`

### Шаг 2: Проверьте GitHub интеграцию
1. В Netlify: **Site settings** → **Build & deploy** → **Continuous deployment**
2. Нажмите **Edit settings** рядом с repository
3. Убедитесь что:
   - Репозиторий: `kimnikge/TA-09`
   - Branch: `main`
   - **Auto publishing:** включено

### Шаг 3: Проверьте веб-хуки GitHub
1. Идите в GitHub: `github.com/kimnikge/TA-09`
2. **Settings** → **Webhooks**
3. Должен быть webhook от Netlify (примерно `hooks.netlify.com`)
4. Если нет - переподключите репозиторий в Netlify

### Шаг 4: Принудительный редеплой
1. В Netlify Dashboard
2. **Deploys** → **Trigger deploy** → **Deploy site**
3. Проверьте логи сборки на ошибки

### Шаг 5: Проверьте логи деплоя
1. В Netlify откройте последний деплой
2. Посмотрите **Deploy log** на ошибки
3. Часто проблема в команде сборки или отсутствии зависимостей

## 🔍 Команды для диагностики:

### Локальная проверка сборки:
```bash
cd frontend
npm install
npm run build
ls -la dist/
```

### Проверка размеров файлов:
```bash
cd frontend/dist
du -sh *
```

## ⚡ Быстрое решение:

### Если ничего не помогает:
1. **Удалите сайт** в Netlify
2. **Создайте новый** с подключением к GitHub
3. Используйте эти настройки:
   - **Build command:** `cd frontend && npm run build`
   - **Publish directory:** `frontend/dist`
   - **Environment variables:** скопируйте из старого сайта

## 🎯 Команды для тестирования:

### После каждого изменения делайте:
```bash
git add .
git commit -m "test: trigger netlify deploy"
git push
```

### Проверьте что изменения попали в GitHub:
- Откройте github.com/kimnikge/TA-09
- Убедитесь что последний коммит отображается

### Проверьте в Netlify:
- **Deploys** должен показать новый деплой
- Если нет - значит webhook не работает

## 📞 Если проблема остается:
1. Покажите скриншот настроек Netlify (Build & deploy)
2. Покажите логи последнего деплоя
3. Проверим GitHub webhooks вместе
