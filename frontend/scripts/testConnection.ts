import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Тестируем подключение к Supabase...\n');

  try {
    // Тест 1: Проверяем подключение
    console.log('1️⃣ Проверяем базовое подключение...');
    const { error: connectionError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Ошибка подключения:', connectionError);
      return;
    }
    console.log('✅ Подключение успешно');

    // Тест 2: Загрузка товаров
    console.log('\n2️⃣ Загружаем товары...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Ошибка загрузки товаров:', productsError);
    } else {
      console.log(`✅ Загружено товаров: ${products?.length || 0}`);
      if (products && products.length > 0) {
        console.log('📋 Первый товар:', {
          id: products[0].id,
          name: products[0].name,
          price: products[0].price,
          unit: products[0].unit
        });
      }
    }

    // Тест 3: Загрузка клиентов
    console.log('\n3️⃣ Загружаем клиентов...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.error('❌ Ошибка загрузки клиентов:', clientsError);
    } else {
      console.log(`✅ Загружено клиентов: ${clients?.length || 0}`);
      if (clients && clients.length > 0) {
        console.log('📋 Первый клиент:', {
          id: clients[0].id,
          name: clients[0].name,
          company_name: clients[0].company_name
        });
      }
    }

    // Тест 4: Загрузка профилей
    console.log('\n4️⃣ Загружаем профили пользователей...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Ошибка загрузки профилей:', profilesError);
    } else {
      console.log(`✅ Загружено профилей: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('📋 Первый профиль:', {
          id: profiles[0].id,
          name: profiles[0].name,
          email: profiles[0].email,
          role: profiles[0].role
        });
      }
    }

    console.log('\n🎉 Тестирование завершено успешно!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
testConnection()
  .then(() => {
    console.log('\n✅ Тест завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка при тестировании:', error);
    process.exit(1);
  });
