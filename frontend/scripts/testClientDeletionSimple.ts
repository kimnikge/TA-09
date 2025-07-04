import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Загружаем переменные окружения
dotenv.config();

// Создаем клиент Supabase напрямую
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODQ2MjEsImV4cCI6MjA0NzQ2MDYyMX0.3uVYpQsv_gIZEOJRcEBXVVJmNZFsRnrqMZ3pzKJsHBo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testClientDeletion() {
  console.log('🧪 Тестирование функции удаления клиентов...\n');

  try {
    // 1. Проверяем подключение к базе
    console.log('1️⃣ Проверка подключения к базе данных...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Ошибка подключения:', connectionError);
      return;
    }

    console.log('✅ Подключение к базе данных успешно');

    // 2. Получаем текущие клиенты
    console.log('\n2️⃣ Получение списка клиентов...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.error('❌ Ошибка получения клиентов:', clientsError);
      return;
    }

    console.log('✅ Найдено клиентов:', clients?.length || 0);

    if (clients && clients.length > 0) {
      console.log('\n📋 Примеры клиентов:');
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`);
      });
    }

    // 3. Создаем тестового клиента
    console.log('\n3️⃣ Создание тестового клиента...');
    const testClientData = {
      name: `Тестовый клиент для удаления ${Date.now()}`,
      address: 'ул. Тестовая для удаления, д. 123',
      created_by: 'test-user-id'
    };

    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert(testClientData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Ошибка создания клиента:', createError);
      console.log('Детали ошибки:');
      console.log('- Код:', createError.code);
      console.log('- Сообщение:', createError.message);
      return;
    }

    console.log('✅ Клиент создан:', newClient.name, '(ID:', newClient.id + ')');

    // 4. Проверяем, есть ли у клиента заказы
    console.log('\n4️⃣ Проверка заказов клиента...');
    const { data: clientOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('client_id', newClient.id);

    if (ordersError) {
      console.error('❌ Ошибка проверки заказов:', ordersError);
    } else {
      console.log('✅ Заказов у клиента:', clientOrders?.length || 0);
    }

    // 5. Пытаемся удалить клиента
    console.log('\n5️⃣ Попытка удаления клиента...');
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', newClient.id);

    if (deleteError) {
      console.error('❌ Ошибка удаления клиента:', deleteError);
      console.log('\n📋 Анализ ошибки:');
      console.log('- Код:', deleteError.code);
      console.log('- Сообщение:', deleteError.message);
      console.log('- Подробности:', deleteError.details);
      
      // Проверяем тип ошибки
      if (deleteError.message.includes('permission denied')) {
        console.log('🔒 Причина: Недостаточно прав для удаления клиента');
        console.log('💡 Решение: Нужно войти как админ или создать клиента под текущим пользователем');
      } else if (deleteError.message.includes('Row Level Security')) {
        console.log('🔒 Причина: Ошибка прав доступа (RLS)');
        console.log('💡 Решение: Проверить RLS политики для таблицы clients');
      } else if (deleteError.message.includes('foreign key')) {
        console.log('🔗 Причина: Клиент связан с другими записями');
        console.log('💡 Решение: Сначала удалить все связанные заказы');
      }
      
      return;
    }

    console.log('✅ Клиент успешно удален!');

    // 6. Проверяем, что клиент действительно удален
    console.log('\n6️⃣ Проверка удаления...');
    const { data: deletedClient, error: finalCheckError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', newClient.id)
      .single();

    if (finalCheckError && finalCheckError.code === 'PGRST116') {
      console.log('✅ Клиент успешно удален из базы данных');
    } else if (deletedClient) {
      console.log('❌ Клиент все еще существует в базе данных');
    } else {
      console.log('❓ Неопределенный результат:', finalCheckError);
    }

    console.log('\n🎉 ТЕСТ УДАЛЕНИЯ ЗАВЕРШЕН!');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запускаем тест
testClientDeletion().catch(console.error);
