import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrixazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseClientsDeletion() {
  console.log('🔍 Диагностика проблем с удалением клиентов...\n');

  try {
    // 1. Проверяем текущих пользователей
    console.log('1️⃣ Проверка текущих пользователей:');
    const { data: user } = await supabase.auth.getUser();
    
    if (user?.user) {
      console.log(`   ✅ Текущий пользователь: ${user.user.email}`);
      console.log(`   📧 ID пользователя: ${user.user.id}`);
    } else {
      console.log('   ❌ Пользователь не авторизован');
    }

    // 2. Проверяем профиль пользователя
    if (user?.user) {
      console.log('\n2️⃣ Проверка профиля пользователя:');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (profileError) {
        console.log('   ❌ Ошибка получения профиля:', profileError.message);
      } else {
        console.log(`   ✅ Профиль найден: ${profile.name}`);
        console.log(`   🔑 Роль: ${profile.role}`);
        console.log(`   ✅ Одобрен: ${profile.approved}`);
      }
    }

    // 3. Проверяем всех клиентов
    console.log('\n3️⃣ Проверка всех клиентов:');
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (allClientsError) {
      console.log('   ❌ Ошибка получения клиентов:', allClientsError.message);
    } else {
      console.log(`   📊 Всего клиентов: ${allClients?.length || 0}`);
      
      if (allClients && allClients.length > 0) {
        console.log('\n   📋 Первые 5 клиентов:');
        allClients.slice(0, 5).forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name}`);
          console.log(`      ID: ${client.id}`);
          console.log(`      Адрес: ${client.address}`);
          console.log(`      Создан: ${client.created_by ? client.created_by.slice(0, 8) + '...' : 'Неизвестно'}`);
          console.log(`      Дата: ${new Date(client.created_at).toLocaleString('ru-RU')}`);
          console.log('');
        });
      }
    }

    // 4. Тестируем удаление клиента
    console.log('\n4️⃣ Тестирование удаления клиента:');
    
    if (allClients && allClients.length > 0) {
      // Берем последнего клиента для тестирования
      const testClient = allClients[allClients.length - 1];
      console.log(`   🧪 Тестируем удаление клиента: ${testClient.name}`);
      
      // Проверяем, используется ли клиент в заказах
      console.log('   📦 Проверка заказов клиента...');
      const { data: clientOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('client_id', testClient.id);
      
      if (ordersError) {
        console.log('   ❌ Ошибка проверки заказов:', ordersError.message);
      } else {
        console.log(`   📊 Заказов у клиента: ${clientOrders?.length || 0}`);
        
        if (clientOrders && clientOrders.length > 0) {
          console.log('   ⚠️  Клиент используется в заказах - удаление может быть заблокировано');
        } else {
          console.log('   ✅ Клиент не используется в заказах - можно удалить');
        }
      }
      
      // Пробуем удалить клиента
      console.log('   🗑️  Попытка удаления...');
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', testClient.id);
      
      if (deleteError) {
        console.log('   ❌ Ошибка удаления:', deleteError.message);
        console.log('   📋 Код ошибки:', deleteError.code);
        console.log('   🔍 Детали:', deleteError.details);
      } else {
        console.log('   ✅ Клиент успешно удален');
        
        // Восстанавливаем клиента обратно
        console.log('   🔄 Восстановление клиента...');
        const { error: restoreError } = await supabase
          .from('clients')
          .insert([{
            id: testClient.id,
            name: testClient.name,
            company_name: testClient.company_name,
            seller_name: testClient.seller_name,
            address: testClient.address,
            created_by: testClient.created_by,
            created_at: testClient.created_at
          }]);
        
        if (restoreError) {
          console.log('   ❌ Ошибка восстановления:', restoreError.message);
        } else {
          console.log('   ✅ Клиент восстановлен');
        }
      }
    }

    // 5. Проверяем RLS политики
    console.log('\n5️⃣ Проверка RLS политик:');
    
    // Проверяем, включен ли RLS для таблицы clients
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('check_rls_policies', { table_name: 'clients' })
      .single();
    
    if (rlsError) {
      console.log('   ❌ Ошибка проверки RLS:', rlsError.message);
      console.log('   ℹ️  Возможно, функция check_rls_policies не существует');
    } else {
      console.log('   ✅ RLS информация получена');
      console.log('   📋 Детали:', rlsInfo);
    }

    // 6. Проверяем права доступа
    console.log('\n6️⃣ Проверка прав доступа:');
    
    if (user?.user) {
      // Пробуем создать тестового клиента
      console.log('   🧪 Тестирование создания клиента...');
      const testClientData = {
        name: 'ТЕСТОВЫЙ КЛИЕНТ ДЛЯ УДАЛЕНИЯ',
        address: 'Тестовый адрес',
        created_by: user.user.id
      };
      
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert([testClientData])
        .select()
        .single();
      
      if (createError) {
        console.log('   ❌ Ошибка создания клиента:', createError.message);
      } else {
        console.log('   ✅ Тестовый клиент создан:', newClient.name);
        
        // Пробуем удалить тестового клиента
        console.log('   🗑️  Попытка удаления тестового клиента...');
        const { error: deleteTestError } = await supabase
          .from('clients')
          .delete()
          .eq('id', newClient.id);
        
        if (deleteTestError) {
          console.log('   ❌ Ошибка удаления тестового клиента:', deleteTestError.message);
          console.log('   📋 Код ошибки:', deleteTestError.code);
          
          // Анализируем тип ошибки
          if (deleteTestError.message.includes('permission denied')) {
            console.log('   🔐 ПРИЧИНА: Недостаточно прав для удаления');
          } else if (deleteTestError.message.includes('Row Level Security')) {
            console.log('   🔐 ПРИЧИНА: Блокировка Row Level Security');
          } else if (deleteTestError.message.includes('foreign key')) {
            console.log('   🔗 ПРИЧИНА: Клиент связан с другими записями');
          } else {
            console.log('   ❓ ПРИЧИНА: Неизвестная ошибка');
          }
        } else {
          console.log('   ✅ Тестовый клиент успешно удален');
        }
      }
    }

    console.log('\n📊 ИТОГОВЫЙ АНАЛИЗ:');
    console.log('━'.repeat(40));
    
    // Выводы
    if (user?.user) {
      console.log('✅ Аутентификация: Пользователь авторизован');
    } else {
      console.log('❌ Аутентификация: Пользователь НЕ авторизован');
    }
    
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    console.log('1. Проверьте RLS политики для таблицы clients');
    console.log('2. Убедитесь, что у пользователя есть права на удаление');
    console.log('3. Проверьте, не используются ли клиенты в заказах');
    console.log('4. Рассмотрите возможность мягкого удаления (active=false)');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

diagnoseClientsDeletion();
