import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSalesRepWithClients() {
  console.log('👤 Создание тестового торгового представителя с клиентами...\n');

  try {
    // 1. Найдем существующего пользователя с ролью sales_rep
    console.log('1. Поиск существующего торгового представителя...');
    
    const { data: salesReps, error: salesRepsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep')
      .not('name', 'is', null)
      .limit(1);

    if (salesRepsError) {
      console.error('❌ Ошибка при поиске торговых представителей:', salesRepsError);
      return;
    }

    let salesRep;
    
    if (salesReps && salesReps.length > 0) {
      salesRep = salesReps[0];
      console.log(`✅ Найден торговый представитель: ${salesRep.name} (${salesRep.email})`);
    } else {
      console.log('⚠️  Не найдено активных торговых представителей');
      
      // Попробуем найти любого пользователя с ролью sales_rep
      const { data: anySalesReps, error: anyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'sales_rep')
        .limit(1);

      if (anyError || !anySalesReps || anySalesReps.length === 0) {
        console.log('❌ Не найдено торговых представителей в системе');
        return;
      }

      salesRep = anySalesReps[0];
      
      // Обновим профиль торгового представителя
      const { data: updatedSalesRep, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: 'Иван Петров (Тестовый)',
          email: salesRep.email || 'ivan.petrov@test.com'
        })
        .eq('id', salesRep.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Ошибка при обновлении профиля:', updateError);
        return;
      }

      salesRep = updatedSalesRep;
      console.log(`✅ Обновлен торговый представитель: ${salesRep.name}`);
    }

    console.log(`   ID: ${salesRep.id}`);
    console.log(`   Роль: ${salesRep.role}`);
    console.log('');

    // 2. Создаем несколько клиентов для этого торгового представителя
    console.log('2. Создание клиентов для торгового представителя...');
    
    const clientsData = [
      {
        name: 'ООО "Альфа"',
        company_name: 'ООО "Альфа Торг"',
        seller_name: 'Менеджер по закупкам',
        address: 'г. Москва, ул. Садовая, д. 15',
        created_by: salesRep.id
      },
      {
        name: 'ИП Сидоров А.В.',
        company_name: 'ИП Сидоров Алексей Владимирович',
        seller_name: 'Индивидуальный предприниматель',
        address: 'г. Санкт-Петербург, пр. Невский, д. 88',
        created_by: salesRep.id
      },
      {
        name: 'ООО "Бета Плюс"',
        company_name: 'ООО "Бета Плюс"',
        seller_name: 'Директор по продажам',
        address: 'г. Екатеринбург, ул. Ленина, д. 23',
        created_by: salesRep.id
      },
      {
        name: 'Магазин "У Дома"',
        company_name: 'ООО "Торговый Дом"',
        seller_name: 'Управляющий',
        address: 'г. Новосибирск, ул. Красный проспект, д. 45',
        created_by: salesRep.id
      },
      {
        name: 'ТЦ "Центральный"',
        company_name: 'ООО "Центральный ТК"',
        seller_name: 'Начальник отдела закупок',
        address: 'г. Казань, ул. Баумана, д. 12',
        created_by: salesRep.id
      }
    ];

    const createdClients = [];
    
    for (const clientData of clientsData) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error(`❌ Ошибка при создании клиента "${clientData.name}":`, clientError.message);
      } else {
        createdClients.push(newClient);
        console.log(`✅ Создан клиент: ${newClient.name}`);
      }
    }

    console.log(`\n📊 Итого создано клиентов: ${createdClients.length}`);
    console.log('');

    // 3. Проверяем, сколько всего клиентов у этого торгового представителя
    console.log('3. Проверка всех клиентов торгового представителя...');
    
    const { data: allUserClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('created_by', salesRep.id)
      .order('created_at', { ascending: false });

    if (allClientsError) {
      console.error('❌ Ошибка при получении клиентов:', allClientsError);
    } else {
      console.log(`✅ Всего клиентов у торгового представителя "${salesRep.name}": ${allUserClients?.length || 0}`);
      
      if (allUserClients && allUserClients.length > 0) {
        allUserClients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name}`);
          console.log(`      Компания: ${client.company_name || 'Не указана'}`);
          console.log(`      Создан: ${new Date(client.created_at).toLocaleString('ru-RU')}`);
        });
      }
    }

    console.log('\n🎉 Тестовые данные созданы успешно!');
    console.log('');
    console.log('📋 РЕЗЮМЕ:');
    console.log(`   👤 Торговый представитель: ${salesRep.name}`);
    console.log(`   📧 Email: ${salesRep.email || 'Не указан'}`);
    console.log(`   🆔 ID: ${salesRep.id}`);
    console.log(`   👥 Клиентов: ${allUserClients?.length || 0}`);
    console.log('');
    console.log('🖥️  ПРОВЕРКА В ИНТЕРФЕЙСЕ:');
    console.log('   1. Откройте приложение в браузере: http://localhost:5173');
    console.log('   2. Войдите в систему с данными этого торгового представителя');
    console.log('   3. Перейдите в раздел КЛИЕНТЫ');
    console.log('   4. Теперь вы должны увидеть список клиентов!');
    console.log('');
    console.log('💡 ВАЖНО: После наших изменений в коде, торговый представитель');
    console.log('   теперь видит ВСЕХ клиентов в системе, а не только своих.');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Функция для очистки тестовых данных
async function cleanupTestData() {
  console.log('🧹 Очистка тестовых данных...\n');

  try {
    // Удаляем тестовых клиентов
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .or('name.like.%Альфа%,name.like.%Сидоров%,name.like.%Бета%,name.like.%У Дома%,name.like.%Центральный%,name.like.%Тестовый%');

    if (clientsError) {
      console.error('❌ Ошибка при удалении клиентов:', clientsError);
    } else {
      console.log('✅ Тестовые клиенты удалены');
    }

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
  createSalesRepWithClients();
}
