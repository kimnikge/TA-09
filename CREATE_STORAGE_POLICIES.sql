-- Создание политик доступа для bucket product-images
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Политика для публичного чтения изображений
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Политика для загрузки изображений авторизованными пользователями
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

-- 3. Политика для обновления изображений
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

-- 4. Политика для удаления изображений
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

-- 5. Проверка созданных политик
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%product%';
