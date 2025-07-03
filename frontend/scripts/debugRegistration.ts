import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRegistrationIssue() {
  console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМЫ С РЕГИСТРАЦИЕЙ\n');
  console.log('=' .repeat(50));

  try {
    // 1. Проверяем текущих пользователей в auth.users через API
    console.log('\n1️⃣  ПРОВЕРКА ПОЛЬЗОВАТЕЛЕЙ АУТЕНТИФИКАЦИИ');
    console.log('-'.repeat(40));
    
    // Получаем текущего авторизованного пользователя
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Нет авторизованного пользователя:', userError.message);
    } else if (currentUser) {
      console.log('✅ Текущий авторизованный пользователь:');
      console.log(`   ID: ${currentUser.id}`);
      console.log(`   Email: ${currentUser.email}`);
      console.log(`   Создан: ${new Date(currentUser.created_at).toLocaleString('ru-RU')}`);
      console.log(`   Метаданные:`, currentUser.user_metadata);
    } else {
      console.log('⚠️  Нет авторизованного пользователя');
    }

    // 2. Проверяем профили в таблице profiles
    console.log('\n2️⃣  ПРОВЕРКА ТАБЛИЦЫ PROFILES');
    console.log('-'.repeat(30));
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Ошибка при получении профилей:', profilesError);
    } else {
      console.log(`📊 Найдено профилей: ${profiles?.length || 0}`);
      
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`\n   ${index + 1}. Профиль ${profile.id.slice(0, 8)}...:`);
          console.log(`      📧 Email: ${profile.email || 'НЕ УКАЗАН'}`);
          console.log(`      👤 Имя: ${profile.name || 'НЕ УКАЗАНО'}`);
          console.log(`      🏷️  Роль: ${profile.role || 'НЕ УКАЗАНА'}`);
          console.log(`      ✅ Одобрен: ${profile.approved ? 'Да' : 'Нет'}`);
          console.log(`      📅 Создан: ${profile.created_at ? new Date(profile.created_at).toLocaleString('ru-RU') : 'НЕ УКАЗАНО'}`);
        });
      }
    }

    // 3. Тестируем создание профиля вручную
    console.log('\n3️⃣  ТЕСТ СОЗДАНИЯ ПРОФИЛЯ');
    console.log('-'.repeat(30));
    
    if (currentUser) {
      console.log('🧪 Попытка создать профиль для текущего пользователя...');
      
      // Сначала проверим, существует ли уже профиль
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (existingProfile) {
        console.log('⚠️  Профиль уже существует для этого пользователя');
        console.log('   Имя:', existingProfile.name);
        console.log('   Email:', existingProfile.email);
      } else {
        console.log('💾 Создаем отсутствующий профиль...');
        
        const profileData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Новый пользователь',
          role: 'sales_rep',
          approved: false,
          created_at: new Date().toISOString()
        };

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error('❌ Ошибка при создании профиля:', createError);
          console.log('\n🔍 ВОЗМОЖНЫЕ ПРИЧИНЫ:');
          console.log('   1. Политики RLS блокируют создание профиля');
          console.log('   2. Недостаточно прав у текущего пользователя');
          console.log('   3. Нарушение ограничений схемы базы данных');
          console.log('   4. Триггеры базы данных блокируют операцию');
        } else {
          console.log('✅ Профиль создан успешно!');
          console.log(`   ID: ${newProfile.id}`);
          console.log(`   Имя: ${newProfile.name}`);
          console.log(`   Email: ${newProfile.email}`);
        }
      }
    }

    // 4. Проверка политик RLS
    console.log('\n4️⃣  АНАЛИЗ ПОЛИТИК БЕЗОПАСНОСТИ');
    console.log('-'.repeat(35));
    
    console.log('🔒 Проверка доступа к таблице profiles...');
    
    // Тест SELECT
    const { error: selectError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (selectError) {
      console.log('❌ SELECT: Нет доступа для чтения -', selectError.message);
    } else {
      console.log('✅ SELECT: Доступ для чтения есть');
    }

    // Тест INSERT с минимальными данными
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'sales_rep'
      });

    if (insertError) {
      console.log('❌ INSERT: Нет доступа для создания -', insertError.message);
    } else {
      console.log('✅ INSERT: Доступ для создания есть');
      
      // Удаляем тестовую запись
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testId);
    }

    // 5. Рекомендации
    console.log('\n5️⃣  РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ');
    console.log('-'.repeat(35));
    
    console.log('🔧 ВАРИАНТЫ РЕШЕНИЯ:');
    console.log('');
    console.log('1. 📝 СОЗДАТЬ ТРИГГЕР В БАЗЕ ДАННЫХ:');
    console.log('   Автоматически создавать профиль при регистрации пользователя');
    console.log('');
    console.log('2. 🔓 ОБНОВИТЬ ПОЛИТИКИ RLS:');
    console.log('   Разрешить пользователям создавать свои профили');
    console.log('');
    console.log('3. 🛠️  ИСПРАВИТЬ КОД ПРИЛОЖЕНИЯ:');
    console.log('   Использовать service role key для создания профилей');
    console.log('');
    console.log('4. 📋 СОЗДАТЬ ПРОФИЛИ ВРУЧНУЮ:');
    console.log('   Для существующих пользователей без профилей');

    console.log('\n💡 НЕМЕДЛЕННОЕ РЕШЕНИЕ:');
    console.log('   Я создам недостающие профили для всех пользователей без них');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

debugRegistrationIssue();
