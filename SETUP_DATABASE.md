# Настройка базы данных и аутентификации

## 1. Настройка Supabase

### Создание проекта
1. Перейдите на https://supabase.com
2. Создайте новый проект
3. Скопируйте URL проекта и anon key

### Настройка переменных окружения
Отредактируйте файл `frontend/.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Создание таблиц
Выполните SQL скрипт в SQL Editor Supabase:

```sql
-- Создание таблицы профилей
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'sales_rep')) NOT NULL DEFAULT 'sales_rep',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы клиентов
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы товаров
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы заказов
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sales_rep_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы позиций заказа
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Настройка RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Политики для clients
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sales reps can create clients" ON clients FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND approved = true)
);

-- Политики для products
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Политики для orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
  sales_rep_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Sales reps can create orders" ON orders FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND approved = true)
);

-- Политики для order_items
CREATE POLICY "Users can view order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND (
      sales_rep_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 2. Инициализация данных

Запустите скрипт инициализации (необходимо добавить SUPABASE_SERVICE_KEY в переменные окружения):

```bash
cd frontend
npm run seed
```

## 3. Данные для входа

После инициализации будет создан админ:
- **Email**: admin@ta09.com
- **Пароль**: admin123

## 4. Логика работы

1. **Регистрация торгового представителя**:
   - Пользователь регистрируется через форму
   - Создается профиль со статусом `approved: false`
   - Требуется подтверждение администратора

2. **Подтверждение администратором**:
   - Админ видит всех неподтвержденных пользователей
   - Может подтвердить или отклонить регистрацию
   - Может заблокировать активных пользователей

3. **Вход в систему**:
   - Проверяется подтверждение администратором
   - Неподтвержденные пользователи не могут войти
   - Сессия сохраняется между перезагрузками

## 5. Безопасность

- Включен Row Level Security (RLS)
- Каждая таблица имеет соответствующие политики
- Пользователи видят только свои данные (кроме админов)
- Админы имеют полный доступ ко всем данным
