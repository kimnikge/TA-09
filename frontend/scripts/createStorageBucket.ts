import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Загрузка переменных окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStorageBucket() {
  console.log('🔧 Создание bucket для изображений товаров...');

  try {
    // 1. Проверяем существование bucket
    console.log('1. Проверка существования bucket product-images...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Ошибка получения списка buckets:', bucketsError.message);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
    if (productImagesBucket) {
      console.log('✅ Bucket product-images уже существует');
      console.log('📊 Информация о bucket:', {
        id: productImagesBucket.id,
        name: productImagesBucket.name,
        public: productImagesBucket.public,
        file_size_limit: productImagesBucket.file_size_limit,
        allowed_mime_types: productImagesBucket.allowed_mime_types
      });
      return;
    }

    // 2. Создаем bucket
    console.log('2. Создание bucket product-images...');
    const { data: createBucketData, error: createBucketError } = await supabase.storage
      .createBucket('product-images', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

    if (createBucketError) {
      console.error('❌ Ошибка создания bucket:', createBucketError.message);
      
      // Попробуем создать без дополнительных параметров
      console.log('3. Попытка создания простого bucket...');
      const { data: simpleBucketData, error: simpleBucketError } = await supabase.storage
        .createBucket('product-images', {
          public: true
        });

      if (simpleBucketError) {
        console.error('❌ Ошибка создания простого bucket:', simpleBucketError.message);
        return;
      }
      
      console.log('✅ Простой bucket создан успешно');
      console.log('📊 Данные bucket:', simpleBucketData);
    } else {
      console.log('✅ Bucket создан успешно');
      console.log('📊 Данные bucket:', createBucketData);
    }

    // 3. Проверяем создание
    console.log('4. Проверка созданного bucket...');
    const { data: updatedBuckets, error: updatedBucketsError } = await supabase.storage.listBuckets();
    if (updatedBucketsError) {
      console.error('❌ Ошибка получения обновленного списка buckets:', updatedBucketsError.message);
      return;
    }
    
    const newBucket = updatedBuckets.find(bucket => bucket.id === 'product-images');
    if (newBucket) {
      console.log('✅ Bucket product-images успешно создан и найден');
      console.log('📊 Финальная информация о bucket:', {
        id: newBucket.id,
        name: newBucket.name,
        public: newBucket.public,
        file_size_limit: newBucket.file_size_limit,
        allowed_mime_types: newBucket.allowed_mime_types
      });
    } else {
      console.log('⚠️  Bucket product-images не найден после создания');
    }

    // 4. Проверяем политики доступа
    console.log('5. Проверка политик доступа...');
    const { error: policiesError } = await supabase.storage
      .from('product-images')
      .list();

    if (policiesError) {
      console.error('❌ Ошибка доступа к bucket (возможно, нужны политики):', policiesError.message);
      console.log('📝 Рекомендуется настроить политики доступа в Supabase Dashboard');
    } else {
      console.log('✅ Bucket доступен для операций');
    }

    console.log('\n🎉 Настройка Supabase Storage завершена!');
    console.log('📋 Следующие шаги:');
    console.log('   1. Проверьте политики доступа в Supabase Dashboard');
    console.log('   2. Протестируйте загрузку изображений в приложении');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запуск скрипта
createStorageBucket();
