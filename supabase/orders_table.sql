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

-- Политика для чтения и записи (временно разрешаем все)
CREATE POLICY "Enable all access for orders" ON public.orders
    FOR ALL USING (true);

-- Комментарии к таблице
COMMENT ON TABLE public.orders IS 'Таблица заказов';
COMMENT ON COLUMN public.orders.client_id IS 'ID клиента из таблицы clients';
COMMENT ON COLUMN public.orders.total_amount IS 'Общая сумма заказа';
COMMENT ON COLUMN public.orders.items IS 'JSON массив товаров в заказе';
