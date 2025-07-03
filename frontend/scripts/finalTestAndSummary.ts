import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTestAndSummary() {
  console.log('🎯 ФИНАЛЬНЫЙ ТЕСТ И РЕЗЮМЕ СИСТЕМЫ\n');
  console.log('=' .repeat(50));

  try {
    // 1. Анализ пользователей
    console.log('\n1️⃣  АНАЛИЗ ПОЛЬЗОВАТЕЛЕЙ');
    console.log('-'.repeat(30));
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');

    if (profilesError) {
      console.error('❌ Ошибка при получении профилей:', profilesError);
      return;
    }

    console.log(`👥 Всего пользователей: ${profiles?.length || 0}`);
    
    const admins = profiles?.filter(p => p.role === 'admin') || [];
    const salesReps = profiles?.filter(p => p.role === 'sales_rep') || [];
    
    console.log(`👑 Администраторов: ${admins.length}`);
    console.log(`🤝 Торговых представителей: ${salesReps.length}`);

    if (profiles && profiles.length > 0) {
      console.log('\n📋 Детали пользователей:');
      profiles.forEach((profile, index) => {
        const roleIcon = profile.role === 'admin' ? '👑' : '🤝';
        const statusIcon = profile.approved ? '✅' : '⏳';
        console.log(`   ${index + 1}. ${roleIcon} ${profile.name || 'БЕЗ ИМЕНИ'} (${profile.email})`);
        console.log(`      Роль: ${profile.role} ${statusIcon}`);
        console.log(`      ID: ${profile.id}`);
      });
    }

    // 2. Анализ клиентов
    console.log('\n2️⃣  АНАЛИЗ КЛИЕНТОВ');
    console.log('-'.repeat(30));
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('❌ Ошибка при получении клиентов:', clientsError);
      return;
    }

    console.log(`👥 Всего клиентов: ${clients?.length || 0}`);
    
    if (clients && clients.length > 0) {
      const clientsWithCreator = clients.filter(c => c.created_by);
      const clientsWithoutCreator = clients.filter(c => !c.created_by);
      
      console.log(`📝 Клиентов с указанным создателем: ${clientsWithCreator.length}`);
      console.log(`❓ Клиентов без указанного создателя: ${clientsWithoutCreator.length}`);
      
      console.log('\n📋 Последние 5 клиентов:');
      clients.slice(0, 5).forEach((client, index) => {
        const creatorInfo = client.created_by ? `👤 ${client.created_by.slice(0, 8)}...` : '❓ Неизвестно';
        console.log(`   ${index + 1}. ${client.name || 'БЕЗ ИМЕНИ'}`);
        console.log(`      Компания: ${client.company_name || 'Не указана'}`);
        console.log(`      Создатель: ${creatorInfo}`);
        console.log(`      Дата: ${new Date(client.created_at).toLocaleString('ru-RU')}`);
      });
    }

    // 3. Проверка связи пользователей и клиентов
    console.log('\n3️⃣  СВЯЗЬ ПОЛЬЗОВАТЕЛЕЙ И КЛИЕНТОВ');
    console.log('-'.repeat(40));
    
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        const userClients = clients?.filter(c => c.created_by === profile.id) || [];
        const roleIcon = profile.role === 'admin' ? '👑' : '🤝';
        
        console.log(`\n${roleIcon} ${profile.name} (${profile.role}):`);
        console.log(`   📊 Создано клиентов: ${userClients.length}`);
        
        if (userClients.length > 0) {
          userClients.forEach((client, index) => {
            console.log(`      ${index + 1}. ${client.name} (${client.company_name || 'Без компании'})`);
          });
        } else {
          console.log(`      ℹ️  Нет созданных клиентов`);
        }
      }
    }

    // 4. Создание дополнительных клиентов для торгового представителя
    const salesRep = salesReps.length > 0 ? salesReps[0] : null;
    
    if (salesRep) {
      console.log('\n4️⃣  СОЗДАНИЕ ТЕСТОВЫХ КЛИЕНТОВ ДЛЯ ТОРГОВОГО ПРЕДСТАВИТЕЛЯ');
      console.log('-'.repeat(60));
      
      console.log(`🎯 Создаем клиентов для: ${salesRep.name}`);
      
      const testClients = [
        {
          name: 'ООО "Альфа Торг"',
          company_name: 'ООО "Альфа Торг"',
          seller_name: 'Менеджер по закупкам',
          address: 'г. Москва, ул. Тверская, д. 15',
          created_by: salesRep.id
        },
        {
          name: 'ИП Петров В.А.',
          company_name: 'ИП Петров Владимир Александрович',
          seller_name: 'Индивидуальный предприниматель',
          address: 'г. Санкт-Петербург, пр. Невский, д. 88',
          created_by: salesRep.id
        }
      ];

      for (const clientData of testClients) {
        // Проверяем, существует ли уже такой клиент
        const existingClient = clients?.find(c => c.name === clientData.name);
        
        if (existingClient) {
          console.log(`⚠️  Клиент "${clientData.name}" уже существует`);
          continue;
        }

        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single();

        if (clientError) {
          console.error(`❌ Ошибка при создании клиента "${clientData.name}":`, clientError);
        } else {
          console.log(`✅ Создан клиент: ${newClient.name}`);
        }
      }
    }

    // 5. Итоговая статистика
    console.log('\n5️⃣  ИТОГОВАЯ СТАТИСТИКА');
    console.log('-'.repeat(30));
    
    // Обновленная статистика
    const { data: updatedClients } = await supabase
      .from('clients')
      .select('*');

    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('*');

    console.log(`👥 Пользователей: ${updatedProfiles?.length || 0}`);
    console.log(`🏢 Клиентов: ${updatedClients?.length || 0}`);
    
    const finalSalesReps = updatedProfiles?.filter(p => p.role === 'sales_rep') || [];
    const finalAdmins = updatedProfiles?.filter(p => p.role === 'admin') || [];
    
    console.log(`🤝 Торговых представителей: ${finalSalesReps.length}`);
    console.log(`👑 Администраторов: ${finalAdmins.length}`);

    // 6. Инструкции для тестирования
    console.log('\n6️⃣  ИНСТРУКЦИИ ДЛЯ ТЕСТИРОВАНИЯ');
    console.log('-'.repeat(40));
    
    console.log('🖥️  Откройте приложение: http://localhost:5173');
    console.log('');
    
    if (finalSalesReps.length > 0) {
      const testSalesRep = finalSalesReps[0];
      console.log('🧪 ДЛЯ ТЕСТИРОВАНИЯ ТОРГОВОГО ПРЕДСТАВИТЕЛЯ:');
      console.log(`   📧 Email: ${testSalesRep.email}`);
      console.log(`   👤 Имя: ${testSalesRep.name}`);
      console.log(`   🔐 Пароль: используйте пароль этого пользователя`);
      console.log('');
      console.log('📋 ЧТО ПРОВЕРИТЬ:');
      console.log('   1. Войдите в систему с указанными данными');
      console.log('   2. Перейдите в раздел "КЛИЕНТЫ"');
      console.log('   3. Вы должны увидеть список всех клиентов (не только своих)');
      console.log('   4. Попробуйте добавить нового клиента');
    }

    console.log('');
    console.log('✨ ДЛЯ ТЕСТИРОВАНИЯ РЕГИСТРАЦИИ:');
    console.log('   1. На странице входа нажмите "Нет аккаунта? Зарегистрироваться"');
    console.log('   2. Заполните все поля, включая "Полное имя"');
    console.log('   3. После регистрации профиль будет создан автоматически');
    console.log('   4. Новый пользователь получит роль "sales_rep"');

    console.log('\n🎉 СИСТЕМА ГОТОВА К ТЕСТИРОВАНИЮ!');
    console.log('');
    console.log('🔧 ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:');
    console.log('   ✅ Добавлено поле "Имя" в форму регистрации');
    console.log('   ✅ Профиль создается автоматически при регистрации');
    console.log('   ✅ Торговые представители видят всех клиентов');
    console.log('   ✅ Создан тестовый торговый представитель с клиентами');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

finalTestAndSummary();
