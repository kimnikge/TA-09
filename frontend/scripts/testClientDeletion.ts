import dotenv from 'dotenv';
import { supabase } from '../src/supabaseClient';

// Загружаем переменные окружения
dotenv.config();

async function testClientDeletion() {
  console.log('🧪 Тестирование функции удаления клиентов...\n');

  try {
    // 1. Сначала создаем тестового клиента
    console.log('1️⃣ Создание тестового клиента...');
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
      return;
    }

    console.log('✅ Клиент создан:', newClient.name, '(ID:', newClient.id + ')');

    // 2. Проверяем, что клиент существует
    console.log('\n2️⃣ Проверка существования клиента...');
    const { data: clientExists, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', newClient.id)
      .single();

    if (checkError) {
      console.error('❌ Ошибка проверки клиента:', checkError);
      return;
    }

    console.log('✅ Клиент найден:', clientExists.name);

    // 3. Проверяем, есть ли у клиента заказы
    console.log('\n3️⃣ Проверка заказов клиента...');
    const { data: clientOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('client_id', newClient.id);

    if (ordersError) {
      console.error('❌ Ошибка проверки заказов:', ordersError);
      return;
    }

    console.log('✅ Заказов у клиента:', clientOrders?.length || 0);

    // 4. Пытаемся удалить клиента
    console.log('\n4️⃣ Попытка удаления клиента...');
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', newClient.id);

    if (deleteError) {
      console.error('❌ Ошибка удаления клиента:', deleteError);
      console.log('Детали ошибки:');
      console.log('- Код:', deleteError.code);
      console.log('- Сообщение:', deleteError.message);
      console.log('- Подробности:', deleteError.details);
      
      // Проверяем тип ошибки
      if (deleteError.message.includes('permission denied')) {
        console.log('📋 Причина: Недостаточно прав для удаления клиента');
      } else if (deleteError.message.includes('Row Level Security')) {
        console.log('📋 Причина: Ошибка прав доступа (RLS)');
      } else if (deleteError.message.includes('foreign key')) {
        console.log('📋 Причина: Клиент связан с другими записями');
      }
      
      return;
    }

    console.log('✅ Клиент успешно удален!');

    // 5. Проверяем, что клиент действительно удален
    console.log('\n5️⃣ Проверка удаления...');
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

// Дополнительная функция для проверки RLS политик
async function checkRLSPolicies() {
  console.log('\n🔒 Проверка RLS политик для таблицы clients...');
  
  try {
    const { data, error } = await supabase.rpc('get_table_policies', {
      table_name: 'clients'
    });

    if (error) {
      console.log('❌ Не удалось получить информацию о RLS политиках:', error.message);
      return;
    }

    console.log('✅ RLS политики получены:', data);
  } catch (error) {
    console.log('❌ Ошибка при получении RLS политик:', error);
  }
}

// Запускаем тесты
testClientDeletion()
  .then(() => checkRLSPolicies())
  .catch(console.error);
