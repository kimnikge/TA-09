# ТА-09 - Система управления заказами

Веб-приложение для управления заказами с админ-панелью и формой оформления заказов.

## 🚀 Технологии

- **Frontend**: React + TypeScript + Vite
- **Стилизация**: Tailwind CSS
- **База данных**: Supabase (PostgreSQL)
- **Аутентификация**: Supabase Auth
- **Иконки**: Lucide React

## 📁 Структура проекта

```
frontend/
├── src/
│   ├── admin/                        # Админ-модуль (микросервис)
│   │   ├── components/               # Компоненты админки
│   │   ├── hooks/                    # Хуки админки
│   │   ├── pages/                    # Страницы админки
│   │   ├── AdminAccess.tsx           # Контроль доступа
│   │   └── index.tsx                 # Точка входа
│   ├── components/
│   │   └── OrderFormPrototype.tsx    # Компонент формы заказа
│   ├── pages/
│   │   ├── ClientsPage.tsx           # Страница клиентов
│   │   └── OrderPage.tsx             # Страница заказов
│   ├── App.tsx                       # Главное приложение
│   └── supabaseClient.ts             # Конфигурация Supabase
├── scripts/
│   └── updateDatabase.ts             # Утилита диагностики БД
└── public/
```

## 🛠️ Настройка и запуск

### 1. Установка зависимостей
```bash
cd frontend
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env` в папке `frontend/`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Настройка базы данных
Выполните SQL-скрипт `UPDATE_DATABASE.sql` в SQL Editor вашего проекта Supabase.

### 4. Запуск приложения
```bash
npm run dev
```

## 👥 Роли пользователей

- **admin** - доступ к админ-панели, управление пользователями и товарами
- **sales_rep** - создание и управление заказами, работа с клиентами

## 📋 Функциональность

### Для торговых представителей:
- ✅ Создание заказов
- ✅ Управление клиентами
- ✅ Просмотр товаров

### Для администраторов:
- ✅ Все функции торгового представителя
- ✅ Управление пользователями
- ✅ Управление товарами
- ✅ Просмотр отчетов

## 🗄️ Структура базы данных

### Таблицы:
- `profiles` - профили пользователей (id, email, name, role, approved)
- `products` - товары (id, name, category, price, unit, description, stock_quantity)
- `clients` - клиенты (id, name, company, seller, phone, email, address)
- `orders` - заказы (id, client_id, agent_name, total_amount, order_date, delivery_date, status)
- `order_items` - позиции заказов (id, order_id, product_id, quantity, price)

## 🔧 Команды разработчика

### Диагностика базы данных:
```bash
npx tsx scripts/updateDatabase.ts
```

### Сборка для продакшена:
```bash
npm run build
```

## 📱 Адаптивность

Приложение полностью адаптировано для мобильных устройств и планшетов.

## 🔐 Безопасность

- Row Level Security (RLS) настроена для всех таблиц
- Аутентификация через Supabase Auth
- Автоматический выход в 02:00 каждый день
