-- Добавляем поле для мягкого удаления в таблицу clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Создаем индекс для быстрого поиска неудаленных клиентов
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);

-- Обновляем RLS политики для учета мягкого удаления
DROP POLICY IF EXISTS "Users can view clients assigned to them" ON clients;
DROP POLICY IF EXISTS "Users can insert clients for themselves" ON clients;
DROP POLICY IF EXISTS "Users can update clients assigned to them" ON clients;
DROP POLICY IF EXISTS "Users can delete clients assigned to them" ON clients;

-- Политика просмотра: показываем только неудаленные клиенты
CREATE POLICY "Users can view non-deleted clients assigned to them" ON clients
    FOR SELECT USING (
        auth.uid() = created_by AND deleted_at IS NULL
    );

-- Политика вставки: остается без изменений
CREATE POLICY "Users can insert clients for themselves" ON clients
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
    );

-- Политика обновления: только неудаленные клиенты
CREATE POLICY "Users can update non-deleted clients assigned to them" ON clients
    FOR UPDATE USING (
        auth.uid() = created_by AND deleted_at IS NULL
    );

-- Политика удаления: разрешаем мягкое удаление (обновление поля deleted_at)
CREATE POLICY "Users can soft delete clients assigned to them" ON clients
    FOR UPDATE USING (
        auth.uid() = created_by
    ) WITH CHECK (
        auth.uid() = created_by
    );

-- Функция для мягкого удаления клиента
CREATE OR REPLACE FUNCTION soft_delete_client(client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE clients 
    SET deleted_at = NOW()
    WHERE id = client_id 
    AND created_by = auth.uid()
    AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для восстановления клиента
CREATE OR REPLACE FUNCTION restore_client(client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE clients 
    SET deleted_at = NULL
    WHERE id = client_id 
    AND created_by = auth.uid()
    AND deleted_at IS NOT NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для окончательного удаления клиента (только для админов)
CREATE OR REPLACE FUNCTION hard_delete_client(client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Проверяем, что пользователь - админ
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can permanently delete clients';
    END IF;
    
    -- Удаляем связанные заказы
    DELETE FROM order_items WHERE order_id IN (
        SELECT id FROM orders WHERE client_id = client_id
    );
    
    DELETE FROM orders WHERE client_id = client_id;
    
    -- Удаляем клиента
    DELETE FROM clients WHERE id = client_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем представление для получения всех клиентов (включая удаленные) - только для админов
CREATE OR REPLACE VIEW admin_clients_view AS
SELECT 
    c.*,
    p.name as created_by_name,
    CASE 
        WHEN c.deleted_at IS NULL THEN 'active'
        ELSE 'deleted'
    END as status
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id;

-- Права доступа к представлению только для админов
REVOKE ALL ON admin_clients_view FROM PUBLIC;
GRANT SELECT ON admin_clients_view TO authenticated;

-- RLS для представления
ALTER TABLE admin_clients_view ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view all clients" ON admin_clients_view
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
