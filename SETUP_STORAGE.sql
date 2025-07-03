-- Настройка Supabase Storage для изображений товаров
-- Упрощенная версия - только создание bucket

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

-- 2. Проверка создания bucket
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'product-images';

-- ПРИМЕЧАНИЕ: Если вы получаете ошибку "must be owner of table objects",
-- это означает, что у вас нет прав для создания политик через SQL.
-- В этом случае создайте bucket через Supabase Dashboard:
-- 1. Откройте https://app.supabase.com
-- 2. Storage → Create a new bucket
-- 3. Name: product-images, Public: включить
