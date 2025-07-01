-- Обновление таблицы products для поддержки изображений
-- Добавляем колонку image_url если она еще не существует

DO $$ 
BEGIN
    -- Проверяем, существует ли колонка image_url
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'image_url'
    ) THEN
        -- Добавляем колонку image_url
        ALTER TABLE products ADD COLUMN image_url TEXT;
        
        -- Добавляем комментарий к колонке
        COMMENT ON COLUMN products.image_url IS 'URL изображения товара из Supabase Storage';
    END IF;
END $$;

-- Создаем индекс для быстрого поиска товаров с изображениями
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url) WHERE image_url IS NOT NULL;

-- Функция для очистки URL изображения при удалении товара
-- (для автоматического удаления файлов из Storage)
CREATE OR REPLACE FUNCTION delete_product_image()
RETURNS TRIGGER AS $$
BEGIN
    -- Здесь можно добавить логику для удаления файла из Storage
    -- через внешний API или другим способом
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматической очистки изображений при удалении товара
DROP TRIGGER IF EXISTS trigger_delete_product_image ON products;
CREATE TRIGGER trigger_delete_product_image
    BEFORE DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION delete_product_image();
