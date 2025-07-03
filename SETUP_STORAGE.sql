-- Настройка Supabase Storage для изображений товаров
-- Этот скрипт создает bucket 'product-images' и настраивает политики доступа

-- 1. Создание bucket product-images
-- ВАЖНО: Если bucket уже существует, будет ошибка - это нормально
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Включение RLS для objects (если еще не включено)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Удаление существующих политик для product-images (если есть)
DROP POLICY IF EXISTS "Public Access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in product-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files in product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- 4. Создание новых политик доступа для bucket product-images

-- Политика для публичного чтения
CREATE POLICY "Public Access for product-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Политика для аутентифицированных пользователей на загрузку
CREATE POLICY "Authenticated users can upload to product-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

-- Политика для обновления файлов
CREATE POLICY "Users can update files in product-images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

-- Политика для удаления файлов
CREATE POLICY "Users can delete files in product-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

-- 5. Проверка создания bucket
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'product-images';

-- 6. Проверка политик
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%product-images%'
ORDER BY policyname;

-- Политика доступа: только аутентифицированные пользователи могут удалять изображения
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- Политика доступа: только аутентифицированные пользователи могут обновлять изображения
CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');
