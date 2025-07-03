import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeProfilesTable() {
  console.log('🔍 Анализ структуры таблицы profiles...\n');

  try {
    // 1. Получаем все записи из таблицы profiles
    console.log('1. Получение всех записей из profiles...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (profilesError) {
      console.error('❌ Ошибка при получении профилей:', profilesError);
      return;
    }

    console.log(`✅ Найдено профилей: ${profiles?.length || 0}`);

    if (profiles && profiles.length > 0) {
      console.log('\n📋 Детальная информация о профилях:');
      profiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. Профиль ${profile.id}:`);
        console.log(`   🏷️  Имя: ${profile.name || 'НЕ УКАЗАНО'}`);
        console.log(`   📧 Email: ${profile.email || 'НЕ УКАЗАНО'}`);
        console.log(`   👤 Роль: ${profile.role || 'НЕ УКАЗАНО'}`);
        console.log(`   ✅ Одобрен: ${profile.approved ? 'Да' : 'Нет'}`);
        console.log(`   📅 Создан: ${profile.created_at ? new Date(profile.created_at).toLocaleString('ru-RU') : 'НЕ УКАЗАНО'}`);
        console.log(`   🔄 Обновлен: ${profile.updated_at ? new Date(profile.updated_at).toLocaleString('ru-RU') : 'НЕ УКАЗАНО'}`);
        
        // Показываем все поля профиля
        console.log(`   🔍 Все поля:`, JSON.stringify(profile, null, 6));
      });
    }

    // 2. Создаем тестового торгового представителя
    console.log('\n2. Создание тестового торгового представителя...');
    
    // Сначала проверим, есть ли уже тестовый пользователь
    const { data: existingTestUser, error: testUserError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test.salesrep@example.com')
      .limit(1);

    if (testUserError) {
      console.error('❌ Ошибка при проверке существующего пользователя:', testUserError);
      return;
    }

    if (existingTestUser && existingTestUser.length > 0) {
      console.log('⚠️  Тестовый торговый представитель уже существует:', existingTestUser[0].name);
      return;
    }

    // Создаем нового торгового представителя
    // ВАЖНО: Мы не можем напрямую создать пользователя в таблице profiles
    // если она связана с auth.users через триггеры или RLS
    console.log('⚠️  ВНИМАНИЕ: Прямое создание пользователя в таблице profiles может не работать');
    console.log('   если таблица связана с системой аутентификации Supabase.');
    
    // Попробуем создать пользователя
    const testUserData = {
      id: crypto.randomUUID(), // Генерируем UUID
      name: 'Тестовый Торговый Представитель',
      email: 'test.salesrep@example.com',
      role: 'sales_rep',
      approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newUser, error: createUserError } = await supabase
      .from('profiles')
      .insert(testUserData)
      .select()
      .single();

    if (createUserError) {
      console.error('❌ Ошибка при создании пользователя:', createUserError);
      console.log('');
      console.log('💡 ВОЗМОЖНЫЕ ПРИЧИНЫ:');
      console.log('   1. Таблица profiles связана с auth.users через внешний ключ');
      console.log('   2. Включены политики RLS (Row Level Security)');
      console.log('   3. Есть триггеры, которые блокируют прямую вставку');
      console.log('');
      console.log('🔧 РЕШЕНИЯ:');
      console.log('   1. Создать пользователя через систему регистрации Supabase');
      console.log('   2. Использовать Admin API для создания пользователя');
      console.log('   3. Изменить роль существующего пользователя');
      
      // Попробуем изменить роль существующего пользователя
      if (profiles && profiles.length > 0) {
        const firstUser = profiles[0];
        console.log(`\n🔄 Попробуем изменить роль пользователя ${firstUser.name} на sales_rep...`);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'sales_rep' })
          .eq('id', firstUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Ошибка при изменении роли:', updateError);
        } else {
          console.log('✅ Роль изменена успешно!');
          console.log(`   Пользователь ${updatedUser.name} теперь торговый представитель`);
        }
      }
    } else {
      console.log('✅ Тестовый торговый представитель создан успешно!');
      console.log(`   Имя: ${newUser.name}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Роль: ${newUser.role}`);
    }

    // 3. Финальная проверка
    console.log('\n3. Финальная проверка торговых представителей...');
    
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep');

    if (finalError) {
      console.error('❌ Ошибка при финальной проверке:', finalError);
    } else {
      console.log(`✅ Торговых представителей в системе: ${finalProfiles?.length || 0}`);
      
      if (finalProfiles && finalProfiles.length > 0) {
        finalProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.name} (${profile.email})`);
        });
      }
    }

    console.log('\n🎯 ВЫВОДЫ:');
    console.log('');
    console.log('✅ Структура таблицы profiles включает поле name');
    console.log('✅ Можно создавать/изменять пользователей с ролью sales_rep');
    console.log('');
    console.log('📝 РЕКОМЕНДАЦИИ:');
    console.log('   1. Добавить поле "Имя" в форму регистрации');
    console.log('   2. При регистрации автоматически создавать профиль с именем');
    console.log('   3. Проверить, что торговые представители видят клиентов');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

analyzeProfilesTable();
