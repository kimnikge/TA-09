-- Схема БД для приложения "Форма заказа для торговых представителей"

-- Таблица клиентов
CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    company_name text,
    seller_name text,
    address text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Таблица товаров
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    image_url text,
    unit text,
    price numeric NOT NULL,
    active boolean DEFAULT true
);

-- Таблица заказов
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rep_id uuid NOT NULL,
    client_id uuid REFERENCES clients(id),
    delivery_date date NOT NULL,
    total_items integer,
    total_price numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Таблица позиций заказа
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id),
    quantity integer NOT NULL,
    price numeric NOT NULL,
    unit text,
    comment text
);

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Триггер для автосоздания профиля при регистрации пользователя
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
