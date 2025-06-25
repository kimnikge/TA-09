-- Таблица клиентов (clients)
create table if not exists clients (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    company_name text,
    seller_name text,
    address text,
    created_by uuid,
    created_at timestamp with time zone default now()
);

-- Таблица товаров (products)
create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    image_url text,
    unit text,
    price numeric not null,
    active boolean default true
);

-- Таблица заказов (orders)
create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    rep_id uuid not null,
    client_id uuid not null references clients(id) on delete cascade,
    delivery_date date not null,
    total_items integer not null,
    total_price numeric not null,
    created_at timestamp with time zone default now()
);

-- Таблица позиций заказа (order_items)
create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    quantity integer not null,
    price numeric not null,
    unit text,
    comment text
); 