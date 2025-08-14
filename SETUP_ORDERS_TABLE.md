# Инструкция по настройке базы данных

## Создание таблицы orders в Supabase

Для работы функции отправки заказов необходимо создать таблицу `orders` в вашей базе данных Supabase.

### Шаги:

1. **Откройте Supabase Dashboard**
   - Перейдите на https://supabase.com/dashboard
   - Выберите ваш проект TA-09

2. **Перейдите в SQL Editor**
   - В левом меню выберите "SQL Editor"
   - Нажмите "New query"

3. **Выполните SQL запрос**
   
   Скопируйте и выполните следующий SQL код:

   ```sql
   -- Создание таблицы orders
   CREATE TABLE IF NOT EXISTS public.orders (
       id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
       client_id uuid REFERENCES public.clients(id),
       total_amount decimal(10,2) NOT NULL,
       items jsonb,
       created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- Включаем RLS
   ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

   -- Политика для чтения и записи
   CREATE POLICY "Enable all access for orders" ON public.orders
       FOR ALL USING (true);
   ```

4. **Нажмите RUN**

После выполнения этого запроса таблица `orders` будет создана и функция отправки заказов будет работать правильно.

## Структура таблицы orders:

- `id` - уникальный идентификатор заказа (UUID)
- `client_id` - ссылка на клиента из таблицы clients
- `total_amount` - общая сумма заказа
- `items` - JSON массив с товарами заказа
- `created_at` - дата и время создания заказа

## Проверка

После создания таблицы вы сможете:
- ✅ Создавать новых клиентов  
- ✅ Отправлять заказы без ошибок
- ✅ Просматривать заказы в таблице Supabase
