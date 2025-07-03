import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSalesRepAndClient() {
  console.log('🚀 Создание тестового торгового представителя и клиента...\n');

  try {
    // Проверяем подключение к Supabase
    console.log('0. Проверка подключения к Supabase...');
    console.log('   URL:', supabaseUrl);
    console.log('   Key:', supabaseKey.substring(0, 20) + '...');
    
    // Тестовый запрос для проверки подключения
    const { error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Ошибка подключения к Supabase:', testError);
      return;
    }
    
    console.log('✅ Подключение к Supabase успешно');
    console.log('');

    // 1. Создаем пользователя через auth.signUp
    console.log('1. Создание пользователя через auth.signUp...');
    
    const timestamp = Date.now();
    const testEmail = `ivan.petrov.${timestamp}@gmail.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Иван Петров';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName  // Используем full_name, как настроено в триггере
        }
      }
    });

    if (authError) {
      console.error('❌ Ошибка при создании пользователя:', authError);
      return;
    }

    console.log('✅ Пользователь создан через auth.signUp');
    console.log('   User ID:', authData.user?.id);
    console.log('   Email:', authData.user?.email);
    console.log('');

    // 2. Ждем немного для обработки триггера
    console.log('2. Ждем создания профиля через триггер...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Проверяем, что профиль создался
    console.log('3. Проверка создания профиля...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    let salesRep;

    if (profileError) {
      console.error('❌ Профиль не найден:', profileError);
      
      // Попробуем создать профиль вручную
      console.log('   Создаем профиль вручную...');
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          name: testName,
          email: testEmail,
          role: 'sales_rep',
          approved: false
        })
        .select()
        .single();

      if (manualError) {
        console.error('❌ Ошибка при создании профиля вручную:', manualError);
        return;
      }

      console.log('✅ Профиль создан вручную:', manualProfile);
      console.log('');
      
      salesRep = manualProfile;
    } else {
      console.log('✅ Профиль найден:', profile);
      console.log('   ID:', profile.id);
      console.log('   Имя:', profile.name);
      console.log('   Роль:', profile.role);
      console.log('   Одобрен:', profile.approved);
      console.log('');
      
      salesRep = profile;
    }

    if (!salesRep) {
      console.error('❌ Не удалось получить данные торгового представителя');
      return;
    }

    // 4. Создаем клиента от имени торгового представителя
    console.log('4. Создание клиента от имени торгового представителя...');
    
    const clientData = {
      name: 'Алексей Сидоров',
      company_name: 'ООО "Тестовая компания"',
      seller_name: 'Менеджер по продажам',
      address: 'г. Москва, ул. Тестовая, д. 123',
      created_by: salesRep.id
    };

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (clientError) {
      console.error('❌ Ошибка при создании клиента:', clientError);
      return;
    }

    console.log('✅ Клиент создан:', client);
    console.log('   ID:', client.id);
    console.log('   Имя:', client.name);
    console.log('   Компания:', client.company_name);
    console.log('   Создан пользователем:', client.created_by);
    console.log('');

    // 5. Проверяем, что клиент правильно привязан к торговому представителю
    console.log('5. Проверка связи клиента и торгового представителя...');
    
    const { data: clientsForSalesRep, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('created_by', salesRep.id);

    if (checkError) {
      console.error('❌ Ошибка при проверке клиентов:', checkError);
      return;
    }

    console.log('✅ Клиенты, созданные торговым представителем:');
    clientsForSalesRep?.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.name} (${c.company_name})`);
    });
    console.log('');

    // 6. Создаем еще одного клиента для полноты тестирования
    console.log('6. Создание второго клиента...');
    
    const client2Data = {
      name: 'Мария Иванова',
      company_name: 'ИП Иванова М.С.',
      seller_name: 'Директор',
      address: 'г. Санкт-Петербург, пр. Невский, д. 45',
      created_by: salesRep.id
    };

    const { data: client2, error: client2Error } = await supabase
      .from('clients')
      .insert(client2Data)
      .select()
      .single();

    if (client2Error) {
      console.error('❌ Ошибка при создании второго клиента:', client2Error);
      return;
    }

    console.log('✅ Второй клиент создан:', client2.name);
    console.log('');

    // 7. Финальная проверка - показываем всех клиентов торгового представителя
    console.log('7. Финальная проверка - все клиенты торгового представителя:');
    
    const { data: allClientsForSalesRep, error: finalCheckError } = await supabase
      .from('clients')
      .select('*')
      .eq('created_by', salesRep.id)
      .order('created_at', { ascending: true });

    if (finalCheckError) {
      console.error('❌ Ошибка при финальной проверке:', finalCheckError);
      return;
    }

    console.log(`✅ Всего клиентов у торгового представителя "${salesRep.name}": ${allClientsForSalesRep?.length || 0}`);
    allClientsForSalesRep?.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.name}`);
      console.log(`      Компания: ${c.company_name}`);
      console.log(`      Продавец: ${c.seller_name}`);
      console.log(`      Адрес: ${c.address}`);
      console.log(`      Создан: ${new Date(c.created_at).toLocaleString('ru-RU')}`);
      console.log('');
    });

    console.log('🎉 Тест успешно завершен!');
    console.log('');
    console.log('📋 Сводка:');
    console.log(`   - Создан торговый представитель: ${salesRep.name} (ID: ${salesRep.id})`);
    console.log(`   - Создано клиентов: ${allClientsForSalesRep?.length || 0}`);
    console.log('');
    console.log('💡 Теперь вы можете войти в систему под этим торговым представителем');
    console.log('   и проверить, что клиенты отображаются в разделе КЛИЕНТЫ.');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Функция для очистки тестовых данных (опционально)
async function cleanupTestData() {
  console.log('🧹 Очистка тестовых данных...\n');

  try {
    // Удаляем тестовых клиентов
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .like('name', '%Тестов%')
      .or('name.like.%Иванова%,name.like.%Сидоров%');

    if (clientsError) {
      console.error('❌ Ошибка при удалении клиентов:', clientsError);
    } else {
      console.log('✅ Тестовые клиенты удалены');
    }

    // Удаляем тестового торгового представителя из profiles
    const { error: salesRepError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', 'ivan.petrov@test.com');

    if (salesRepError) {
      console.error('❌ Ошибка при удалении торгового представителя:', salesRepError);
    } else {
      console.log('✅ Тестовый торговый представитель удален из profiles');
    }

    // Примечание: удаление пользователя из auth.users требует особых прав
    // Это можно сделать через Supabase Dashboard
    console.log('ℹ️  Примечание: Для полной очистки нужно также удалить пользователя');
    console.log('   ivan.petrov@test.com из auth.users через Supabase Dashboard');

    console.log('🎉 Очистка завершена!');

  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
  }
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);

if (args.includes('--cleanup')) {
  cleanupTestData();
} else {
  createSalesRepAndClient();
}
