import { supabase } from '../src/supabaseClient';

async function testSupabaseStorage() {
  console.log('🧪 Тестирование Supabase Storage...');

  try {
    // 1. Проверяем подключение к Supabase
    console.log('1. Проверка подключения к Supabase...');
    const { error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Ошибка авторизации:', authError.message);
      return;
    }
    console.log('✅ Подключение к Supabase установлено');

    // 2. Проверяем существование bucket
    console.log('2. Проверка bucket product-images...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Ошибка получения списка buckets:', bucketsError.message);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
    if (productImagesBucket) {
      console.log('✅ Bucket product-images найден');
      console.log('📊 Информация о bucket:', {
        id: productImagesBucket.id,
        name: productImagesBucket.name,
        public: productImagesBucket.public,
        file_size_limit: productImagesBucket.file_size_limit,
        allowed_mime_types: productImagesBucket.allowed_mime_types
      });
    } else {
      console.log('⚠️  Bucket product-images не найден');
      console.log('📝 Доступные buckets:', buckets.map(b => b.id));
    }

    // 3. Проверяем существование таблицы products
    console.log('3. Проверка таблицы products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .limit(1);

    if (productsError) {
      console.error('❌ Ошибка доступа к таблице products:', productsError.message);
      return;
    }
    console.log('✅ Таблица products доступна');
    console.log('📊 Пример товара:', products?.[0] || 'Товаров пока нет');

    // 4. Проверяем возможность получения файлов из bucket
    if (productImagesBucket) {
      console.log('4. Проверка содержимого bucket...');
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 5
        });

      if (filesError) {
        console.error('❌ Ошибка получения файлов:', filesError.message);
      } else {
        console.log('✅ Доступ к bucket разрешен');
        console.log('📁 Файлов в папке products:', files?.length || 0);
        if (files && files.length > 0) {
          console.log('📄 Примеры файлов:', files.slice(0, 3).map(f => f.name));
        }
      }
    }

    console.log('\n🎉 Тестирование завершено успешно!');
    console.log('\n📋 Следующие шаги:');
    if (!productImagesBucket) {
      console.log('  1. Выполните SETUP_STORAGE.sql в вашей Supabase консоли');
    }
    console.log('  2. Попробуйте загрузить изображение через админ-панель');
    console.log('  3. Проверьте отображение изображений в списке товаров');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запуск теста
testSupabaseStorage();
