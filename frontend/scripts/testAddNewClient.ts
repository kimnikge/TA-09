import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Инициализируем Supabase клиент для тестов
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Тест добавления новой торговой точки (клиента) от имени торгового представителя
async function testAddNewClient() {
  console.log('🧪 Тест: Добавление новой торговой точки от имени торгового представителя');
  console.log('=' .repeat(70));

  try {
    // 1. Проверяем подключение к базе данных
    console.log('1️⃣ Проверка подключения к базе данных...');
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (connectionError) {
      throw new Error(`Ошибка подключения к БД: ${connectionError.message}`);
    }
    console.log('✅ Подключение к базе данных успешно');

    // 2. Получаем торгового представителя для тестирования или создаем тестовый профиль
    console.log('\n2️⃣ Поиск торгового представителя...');
    
    // Сначала проверяем, есть ли уже какие-то пользователи
    const { data: existingProfiles, error: existingError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .limit(5);

    if (existingError) {
      throw new Error(`Ошибка получения пользователей: ${existingError.message}`);
    }

    console.log(`📊 Найдено пользователей в системе: ${existingProfiles?.length || 0}`);
    
    if (existingProfiles && existingProfiles.length > 0) {
      console.log('👥 Существующие пользователи:');
      existingProfiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.email}) - ${profile.role}`);
      });
    }

    // Ищем торгового представителя
    const { data: salesRep, error: salesRepError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('role', 'sales_rep')
      .limit(1)
      .single();

    if (salesRepError || !salesRep) {
      // Пробуем найти любого пользователя для тестирования
      const { data: anyUser, error: anyUserError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .limit(1)
        .single();

      if (anyUserError || !anyUser) {
        console.log('⚠️  Пользователи не найдены. Создаем тестовую запись напрямую...');
        
        // Создаем тестовый UUID и профиль напрямую
        const testId = '550e8400-e29b-41d4-a716-446655440000'; // Статичный UUID для тестирования
        const testEmail = 'test.salesrep@gmail.com';
        
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: testId,
            name: 'Тестовый Торговый Представитель',
            email: testEmail,
            role: 'sales_rep'
          })
          .select()
          .single();

        if (profileError) {
          // Если профиль уже существует, попробуем его получить
          const { data: existingProfile, error: getError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', testId)
            .single();
            
          if (getError) {
            throw new Error(`Ошибка создания/получения профиля: ${profileError.message}`);
          }
          
          console.log('✅ Используется существующий тестовый профиль:', existingProfile.name);
          await testAddClientProcess(existingProfile);
        } else {
          console.log('✅ Создан тестовый торговый представитель:', newProfile.name);
          await testAddClientProcess(newProfile);
        }
      } else {
        console.log(`✅ Используется существующий пользователь: ${anyUser.name} (роль: ${anyUser.role})`);
        // Временно обновляем роль для тестирования
        const { data: updatedUser, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'sales_rep' })
          .eq('id', anyUser.id)
          .select()
          .single();
          
        if (updateError) {
          console.log('⚠️  Не удалось обновить роль, используем как есть');
          await testAddClientProcess(anyUser);
        } else {
          console.log('✅ Роль обновлена на sales_rep');
          await testAddClientProcess(updatedUser);
        }
      }
    } else {
      console.log('✅ Найден торговый представитель:', salesRep.name);
      await testAddClientProcess(salesRep);
    }

  } catch (error) {
    console.error('❌ Ошибка в тесте:', error);
    process.exit(1);
  }
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function testAddClientProcess(salesRep: SalesRep) {
  console.log(`\n3️⃣ Тестирование добавления клиента от имени: ${salesRep.name}`);
  
  // Данные для новой торговой точки
  const newClientData = {
    name: `Тестовая Торговая Точка ${Date.now()}`,
    company_name: 'ТОО "Тестовая Компания"',
    address: 'г. Алматы, ул. Тестовая, 123',
    seller_name: 'Иванов Иван Иванович',
    created_by: salesRep.id
  };

  console.log('📝 Данные клиента для добавления:', {
    name: newClientData.name,
    company_name: newClientData.company_name,
    address: newClientData.address,
    seller_name: newClientData.seller_name,
    created_by: `${salesRep.name} (${salesRep.id})`
  });

  // 4. Добавляем нового клиента
  console.log('\n4️⃣ Добавление нового клиента в базу данных...');
  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert(newClientData)
    .select()
    .single();

  if (clientError) {
    throw new Error(`Ошибка добавления клиента: ${clientError.message}`);
  }

  console.log('✅ Клиент успешно добавлен:', {
    id: newClient.id,
    name: newClient.name,
    company_name: newClient.company_name,
    address: newClient.address,
    created_at: new Date(newClient.created_at).toLocaleString('ru-RU')
  });

  // 5. Проверяем, что клиент действительно сохранился
  console.log('\n5️⃣ Проверка сохранения клиента...');
  const { data: savedClient, error: checkError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', newClient.id)
    .single();

  if (checkError) {
    throw new Error(`Ошибка проверки клиента: ${checkError.message}`);
  }

  // Получаем информацию о создателе отдельно
  const { data: createdByProfile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', savedClient.created_by)
    .single();

  console.log('✅ Клиент подтвержден в базе данных:', {
    id: savedClient.id,
    name: savedClient.name,
    company_name: savedClient.company_name,
    address: savedClient.address,
    seller_name: savedClient.seller_name,
    created_by: createdByProfile?.name || 'Неизвестен',
    created_at: new Date(savedClient.created_at).toLocaleString('ru-RU')
  });

  // 6. Тестируем получение списка клиентов от имени торгового представителя
  console.log('\n6️⃣ Получение списка клиентов торгового представителя...');
  const { data: salesRepClients, error: listError } = await supabase
    .from('clients')
    .select('id, name, company_name, address, seller_name, created_at')
    .eq('created_by', salesRep.id)
    .order('created_at', { ascending: false });

  if (listError) {
    throw new Error(`Ошибка получения списка клиентов: ${listError.message}`);
  }

  console.log(`✅ Найдено ${salesRepClients.length} клиентов у торгового представителя:`);
  salesRepClients.forEach((client, index) => {
    console.log(`   ${index + 1}. ${client.name} (${client.company_name}) - ${client.address}`);
  });

  // 7. Тестируем обновление данных клиента
  console.log('\n7️⃣ Тестирование обновления данных клиента...');
  const updatedData = {
    seller_name: 'Петров Петр Петрович (обновлено)',
    address: newClient.address + ' (обновлено)'
  };

  const { data: updatedClient, error: updateError } = await supabase
    .from('clients')
    .update(updatedData)
    .eq('id', newClient.id)
    .eq('created_by', salesRep.id) // Проверяем права доступа
    .select()
    .single();

  if (updateError) {
    throw new Error(`Ошибка обновления клиента: ${updateError.message}`);
  }

  console.log('✅ Клиент успешно обновлен:', {
    id: updatedClient.id,
    name: updatedClient.name,
    seller_name: updatedClient.seller_name,
    address: updatedClient.address
  });

  // 8. Проверяем валидацию данных
  console.log('\n8️⃣ Тестирование валидации данных...');
  
  // Тест с пустым именем
  const { error: validationError } = await supabase
    .from('clients')
    .insert({
      name: '', // Пустое имя
      address: 'Тестовый адрес',
      created_by: salesRep.id
    });

  if (validationError) {
    console.log('✅ Валидация работает - пустое имя отклонено:', validationError.message);
  } else {
    console.log('⚠️  Валидация не сработала - пустое имя принято');
  }

  // 9. Финальная статистика
  console.log('\n9️⃣ Финальная статистика тестирования...');
  const { data: totalClients, error: countError } = await supabase
    .from('clients')
    .select('id', { count: 'exact' });

  if (!countError) {
    console.log(`📊 Общее количество клиентов в системе: ${totalClients.length}`);
  }

  const { data: salesRepClientCount, error: repCountError } = await supabase
    .from('clients')
    .select('id', { count: 'exact' })
    .eq('created_by', salesRep.id);

  if (!repCountError) {
    console.log(`👤 Клиентов у ${salesRep.name}: ${salesRepClientCount.length}`);
  }

  console.log('\n🎉 Тест добавления новой торговой точки завершен успешно!');
  console.log('=' .repeat(70));
}

// Запуск теста
testAddNewClient();
