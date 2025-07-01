-- Создание bucket для изображений товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB в байтах
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Политика доступа: любой аутентифицированный пользователь может загружать изображения
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Политика доступа: любой может читать изображения товаров (public bucket)
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Политика доступа: только аутентифицированные пользователи могут удалять изображения
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- Политика доступа: только аутентифицированные пользователи могут обновлять изображения
CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');
