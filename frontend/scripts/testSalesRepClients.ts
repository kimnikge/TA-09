import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientDisplayForSalesRep() {
  console.log('🧪 Тестирование отображения клиентов для торгового представителя...\n');

  try {
    // 1. Проверяем существующие таблицы
    console.log('1. Проверка доступных таблиц...');
    
    // Проверяем таблицу profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log('   ❌ Таблица profiles:', profilesError.message);
    } else {
      console.log(`   ✅ Таблица profiles найдена, записей: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`      ${index + 1}. ${profile.name} (${profile.role}) - ${profile.email}`);
        });
      }
    }

    // Проверяем таблицу clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(10);

    if (clientsError) {
      console.log('   ❌ Таблица clients:', clientsError.message);
    } else {
      console.log(`   ✅ Таблица clients найдена, записей: ${clients?.length || 0}`);
      if (clients && clients.length > 0) {
        clients.forEach((client, index) => {
          console.log(`      ${index + 1}. ${client.name} (${client.company_name || 'Без компании'})`);
          console.log(`          Создан: ${client.created_by ? 'Пользователем ' + client.created_by : 'Неизвестно'}`);
        });
      }
    }

    console.log('\n2. Анализ проблемы...');
    
    if (!profiles || profiles.length === 0) {
      console.log('   🔍 ПРОБЛЕМА: В таблице profiles нет записей.');
      console.log('   💡 РЕШЕНИЕ: Нужно создать торгового представителя через систему регистрации Supabase.');
      console.log('   📝 ИНСТРУКЦИЯ:');
      console.log('      1. Откройте приложение в браузере');
      console.log('      2. Перейдите на страницу регистрации');
      console.log('      3. Зарегистрируйте нового пользователя');
      console.log('      4. Система автоматически создаст запись в таблице profiles');
    } else {
      console.log('   ✅ В системе есть зарегистрированные пользователи');
      
      const salesReps = profiles.filter(p => p.role === 'sales_rep');
      console.log(`   📊 Торговых представителей: ${salesReps.length}`);
      
      if (salesReps.length === 0) {
        console.log('   ⚠️  Нет пользователей с ролью sales_rep');
        console.log('   💡 Нужно изменить роль существующего пользователя или создать нового');
      }
    }

    console.log('\n3. Тест фильтрации клиентов...');
    
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      console.log(`   🧪 Тестируем фильтрацию для пользователя: ${profiles[0].name} (ID: ${testUserId})`);
      
      // Проверяем клиентов, созданных этим пользователем
      const { data: userClients, error: userClientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', testUserId);

      if (userClientsError) {
        console.log('   ❌ Ошибка при фильтрации:', userClientsError.message);
      } else {
        console.log(`   📋 Клиентов, созданных этим пользователем: ${userClients?.length || 0}`);
        
        if (userClients && userClients.length > 0) {
          userClients.forEach((client, index) => {
            console.log(`      ${index + 1}. ${client.name}`);
          });
        } else {
          console.log('   ⚠️  У этого пользователя нет созданных клиентов');
          console.log('   💡 Это объясняет, почему в интерфейсе ничего не отображается');
        }
      }
    }

    console.log('\n4. Создание тестового клиента...');
    
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      
      const testClientData = {
        name: 'Тестовый Клиент',
        company_name: 'ООО "Тестовая Компания"',
        seller_name: 'Директор',
        address: 'г. Москва, ул. Тестовая, д. 1',
        created_by: testUserId
      };

      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert(testClientData)
        .select()
        .single();

      if (newClientError) {
        console.log('   ❌ Ошибка при создании клиента:', newClientError.message);
      } else {
        console.log('   ✅ Тестовый клиент создан успешно:', newClient.name);
        console.log(`      ID: ${newClient.id}`);
        console.log(`      Создан пользователем: ${newClient.created_by}`);
      }
    }

    console.log('\n🎯 ВЫВОДЫ И РЕКОМЕНДАЦИИ:');
    console.log('');
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ ОСНОВНАЯ ПРОБЛЕМА: Нет зарегистрированных пользователей в системе');
      console.log('📝 ДЛЯ РЕШЕНИЯ:');
      console.log('   1. Зарегистрируйтесь в приложении как новый пользователь');
      console.log('   2. После регистрации система создаст профиль в таблице profiles');
      console.log('   3. Убедитесь, что роль установлена как "sales_rep"');
    } else {
      console.log('✅ В системе есть пользователи');
      console.log('📝 ПРОВЕРЬТЕ:');
      console.log('   1. Авторизованы ли вы в приложении?');
      console.log('   2. Правильная ли у вас роль (sales_rep)?');
      console.log('   3. Есть ли у вас созданные клиенты?');
      console.log('');
      console.log('💡 ПРИМЕЧАНИЕ: Торговые представители видят всех клиентов после наших изменений в коде');
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

testClientDisplayForSalesRep();
