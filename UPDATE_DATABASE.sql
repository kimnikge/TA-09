-- Полное обновление структуры базы данных для приложения ТА-09

-- 1. Обновление таблицы profiles
-- Добавление недостающих колонок
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'sales_rep')) DEFAULT 'sales_rep',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Обновление значений по умолчанию для существующих записей
UPDATE profiles 
SET 
  role = 'sales_rep',
  name = 'Пользователь',
  updated_at = NOW()
WHERE role IS NULL OR name IS NULL;

-- 2. Создание/обновление триггера для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Проверка и создание остальных таблиц (если не существуют)

-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  seller TEXT,
  phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'шт',
  description TEXT,
  image TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица позиций заказа
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Настройка Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. Политики для profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Политики для clients
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Sales reps can create clients" ON clients;
CREATE POLICY "Sales reps can create clients" ON clients FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND approved = true)
);

-- 7. Политики для products
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. Политики для orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
  sales_rep_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Sales reps can create orders" ON orders;
CREATE POLICY "Sales reps can create orders" ON orders FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND approved = true)
);

-- 9. Политики для order_items
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
CREATE POLICY "Users can view order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND (
      sales_rep_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- 10. Добавление тестовых данных

-- Тестовые товары
INSERT INTO products (name, category, price, unit, description) VALUES
('Coca-Cola 0.5L', 'beverages', 150, 'шт', 'Газированный напиток'),
('Pepsi 0.5L', 'beverages', 140, 'шт', 'Газированный напиток'),
('Fanta 0.5L', 'beverages', 130, 'шт', 'Газированный напиток'),
('Sprite 0.5L', 'beverages', 130, 'шт', 'Газированный напиток'),
('Чипсы Lays классические', 'snacks', 320, 'пачка', 'Картофельные чипсы'),
('Чипсы Pringles', 'snacks', 450, 'банка', 'Картофельные чипсы'),
('Сухарики Кириешки', 'snacks', 180, 'пачка', 'Ржаные сухарики'),
('Молоко 2.5% 1L', 'dairy', 250, 'пак', 'Пастеризованное молоко'),
('Творог 9%', 'dairy', 380, 'пачка', 'Творог жирный'),
('Сметана 20%', 'dairy', 300, 'банка', 'Сметана'),
('Йогурт питьевой', 'dairy', 120, 'бут', 'Питьевой йогурт'),
('Хлеб белый', 'bakery', 80, 'шт', 'Хлеб пшеничный'),
('Хлеб черный', 'bakery', 90, 'шт', 'Хлеб ржаной'),
('Порошок стиральный', 'household', 1200, 'пачка', 'Стиральный порошок'),
('Средство для посуды', 'household', 280, 'бут', 'Моющее средство')
ON CONFLICT DO NOTHING;

-- Тестовые клиенты
INSERT INTO clients (name, company, seller, address, phone, email) VALUES
('Магазин "Евразия"', 'ТОО "Торговый дом"', 'Алия Смагулова', 'ул. Абая, 125', '+7 701 123 45 67', 'evraziya@mail.kz'),
('Супермаркет "Народный"', 'ИП Касымов А.Б.', 'Бахыт Касымов', 'мкр. Жетысу-1, д. 45', '+7 702 234 56 78', 'narodniy@gmail.com'),
('Минимаркет "Береке"', 'ТОО "Береке-Трейд"', 'Сауле Абишева', 'ул. Назарбаева, 78', '+7 705 345 67 89', 'bereke@mail.ru'),
('Магазин "Продукты"', 'ИП Иванов И.И.', 'Иван Иванов', 'пр. Достык, 200', '+7 707 456 78 90', 'produkty@inbox.ru')
ON CONFLICT DO NOTHING;

-- 11. Проверка результата
SELECT 
  'profiles' as table_name, 
  count(*) as records_count,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'profiles'
GROUP BY table_name

UNION ALL

SELECT 'products', count(*), null FROM products
UNION ALL
SELECT 'clients', count(*), null FROM clients
UNION ALL
SELECT 'orders', count(*), null FROM orders
UNION ALL
SELECT 'order_items', count(*), null FROM order_items;
