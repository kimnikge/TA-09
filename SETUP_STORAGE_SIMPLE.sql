-- Упрощенная настройка Supabase Storage для изображений товаров
-- Используйте этот скрипт, если основной не работает из-за прав доступа

-- 1. Создание bucket product-images (только если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Простые политики доступа (если предыдущие не работают)

-- Публичное чтение изображений
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT 
USING (bucket_id = 'product-images');

-- Аутентифицированные пользователи могут загружать изображения
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- 3. Проверка создания bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
