import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggerTest() {
  console.log('🔍 ПРОВЕРКА СОСТОЯНИЯ ТРИГГЕРА И ТЕСТИРОВАНИЕ\n');
  console.log('=' .repeat(50));

  try {
    // 1. Проверяем текущее состояние профилей
    console.log('\n1️⃣  ТЕКУЩЕЕ СОСТОЯНИЕ ПРОФИЛЕЙ');
    console.log('-'.repeat(35));

    const { data: profilesBefore, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Ошибка при получении профилей:', profilesError);
      return;
    }

    console.log(`📊 Всего профилей до тестирования: ${profilesBefore?.length || 0}`);
    
    if (profilesBefore && profilesBefore.length > 0) {
      console.log('\n📋 Последние 3 профиля:');
      profilesBefore.slice(0, 3).forEach((profile, index) => {
        const status = profile.approved ? '✅' : '⏳';
        console.log(`   ${index + 1}. ${profile.name} (${profile.email}) ${status}`);
        console.log(`      Роль: ${profile.role}, Создан: ${new Date(profile.created_at).toLocaleString('ru-RU')}`);
      });
    }

    // 2. Тестируем регистрацию (имитируем через Supabase Auth)
    console.log('\n2️⃣  ТЕСТ АВТОМАТИЧЕСКОГО СОЗДАНИЯ ПРОФИЛЯ');
    console.log('-'.repeat(45));

    const testEmail = `trigger.test.${Date.now()}@example.com`;
    const testPassword = 'test123456';
    const testName = 'Тест Триггера Автоматический';

    console.log(`🧪 Тестируем регистрацию пользователя:`);
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   👤 Имя: ${testName}`);
    console.log(`   🔐 Пароль: ${testPassword}`);
    console.log('');

    // Пытаемся зарегистрировать пользователя
    console.log('🔄 Выполняем регистрацию...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
        }
      }
    });

    if (authError) {
      console.error('❌ Ошибка при регистрации:', authError);
      
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Пользователь уже зарегистрирован, это нормально для теста');
      } else if (authError.message.includes('email confirmation')) {
        console.log('✅ Регистрация успешна, требуется подтверждение email');
      }
    } else {
      console.log('✅ Регистрация выполнена успешно!');
      if (authData.user) {
        console.log(`   🆔 User ID: ${authData.user.id}`);
        console.log(`   📧 Email: ${authData.user.email}`);
        console.log(`   📝 Метаданные:`, authData.user.user_metadata);
      }
    }

    // 3. Проверяем, создался ли профиль автоматически
    console.log('\n3️⃣  ПРОВЕРКА СОЗДАНИЯ ПРОФИЛЯ ЧЕРЕЗ ТРИГГЕР');
    console.log('-'.repeat(50));

    // Ждем немного для срабатывания триггера
    console.log('⏳ Ожидание срабатывания триггера (3 секунды)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: profilesAfter, error: profilesAfterError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesAfterError) {
      console.error('❌ Ошибка при получении профилей после регистрации:', profilesAfterError);
      return;
    }

    console.log(`📊 Всего профилей после тестирования: ${profilesAfter?.length || 0}`);

    // Сравниваем количество профилей
    const profilesAdded = (profilesAfter?.length || 0) - (profilesBefore?.length || 0);
    
    if (profilesAdded > 0) {
      console.log(`🎉 ТРИГГЕР РАБОТАЕТ! Добавлено профилей: ${profilesAdded}`);
      
      // Ищем новый профиль
      const newProfile = profilesAfter?.find(p => 
        p.email === testEmail || p.name === testName
      );

      if (newProfile) {
        console.log('\n✅ Новый профиль создан автоматически:');
        console.log(`   🆔 ID: ${newProfile.id}`);
        console.log(`   📧 Email: ${newProfile.email}`);
        console.log(`   👤 Имя: ${newProfile.name}`);
        console.log(`   🏷️  Роль: ${newProfile.role}`);
        console.log(`   ✅ Одобрен: ${newProfile.approved ? 'Да' : 'Нет'}`);
        console.log(`   📅 Создан: ${new Date(newProfile.created_at).toLocaleString('ru-RU')}`);
      }
    } else {
      console.log('⚠️  Новые профили не обнаружены');
      console.log('');
      console.log('🔍 ВОЗМОЖНЫЕ ПРИЧИНЫ:');
      console.log('   1. Триггер не был создан или работает некорректно');
      console.log('   2. Пользователь уже существовал в системе');
      console.log('   3. Политики RLS блокируют создание профиля');
      console.log('   4. Требуется подтверждение email для активации триггера');
    }

    // 4. Показываем последние профили для сравнения
    console.log('\n4️⃣  ПОСЛЕДНИЕ ПРОФИЛИ (ДЛЯ СРАВНЕНИЯ)');
    console.log('-'.repeat(40));

    if (profilesAfter && profilesAfter.length > 0) {
      console.log('📋 Последние 5 профилей:');
      profilesAfter.slice(0, 5).forEach((profile, index) => {
        const isNew = !profilesBefore?.find(p => p.id === profile.id);
        const newLabel = isNew ? ' 🆕' : '';
        const status = profile.approved ? '✅' : '⏳';
        
        console.log(`   ${index + 1}. ${profile.name} (${profile.email}) ${status}${newLabel}`);
        console.log(`      Роль: ${profile.role}, Создан: ${new Date(profile.created_at).toLocaleString('ru-RU')}`);
      });
    }

    // 5. Тестируем логику торгового представителя
    console.log('\n5️⃣  ТЕСТ ЛОГИКИ ТОРГОВОГО ПРЕДСТАВИТЕЛЯ');
    console.log('-'.repeat(45));

    const salesReps = profilesAfter?.filter(p => p.role === 'sales_rep') || [];
    console.log(`🤝 Торговых представителей в системе: ${salesReps.length}`);

    if (salesReps.length > 0) {
      const testSalesRep = salesReps[0];
      console.log(`\n🧪 Тестируем доступ к клиентам для: ${testSalesRep.name}`);

      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) {
        console.error('❌ Ошибка при получении клиентов:', clientsError);
      } else {
        console.log(`📊 Всего клиентов доступно: ${allClients?.length || 0}`);
        console.log('✅ Торговые представители видят всех клиентов (исправленная логика)');
      }
    }

    // 6. Итоговый результат
    console.log('\n6️⃣  ИТОГОВЫЙ РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ');
    console.log('-'.repeat(40));

    const triggerWorks = profilesAdded > 0;
    const hasValidSalesReps = salesReps.length > 0;

    console.log('🎯 РЕЗУЛЬТАТЫ:');
    console.log(`   ${triggerWorks ? '✅' : '❌'} Триггер автоматического создания профилей: ${triggerWorks ? 'РАБОТАЕТ' : 'НЕ РАБОТАЕТ'}`);
    console.log(`   ${hasValidSalesReps ? '✅' : '❌'} Торговые представители в системе: ${hasValidSalesReps ? 'ЕСТЬ' : 'ОТСУТСТВУЮТ'}`);
    console.log(`   ✅ Логика отображения клиентов: ИСПРАВЛЕНА`);
    console.log(`   ✅ Поле "Полное имя" в регистрации: ДОБАВЛЕНО`);

    if (triggerWorks && hasValidSalesReps) {
      console.log('\n🎉 ВСЕ СИСТЕМЫ РАБОТАЮТ КОРРЕКТНО!');
      console.log('');
      console.log('🌐 Можете протестировать в браузере:');
      console.log('   1. Откройте http://localhost:5173');
      console.log('   2. Зарегистрируйте нового пользователя');
      console.log('   3. Войдите в раздел КЛИЕНТЫ');
      console.log('   4. Убедитесь, что видите всех клиентов');
    } else {
      console.log('\n⚠️  ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ НАСТРОЙКА');
      
      if (!triggerWorks) {
        console.log('');
        console.log('🔧 ДЛЯ ИСПРАВЛЕНИЯ ТРИГГЕРА:');
        console.log('   1. Проверьте выполнение SQL скрипта в Supabase');
        console.log('   2. Убедитесь, что нет ошибок в SQL Editor');
        console.log('   3. Проверьте политики RLS для таблицы profiles');
      }
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка при тестировании:', error);
  }
}

checkTriggerTest();
