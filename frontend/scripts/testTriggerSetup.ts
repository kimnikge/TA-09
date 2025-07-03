import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTriggerSetup() {
  console.log('🔍 ПРОВЕРКА РАБОТЫ ТРИГГЕРА\n');
  console.log('=' .repeat(35));

  try {
    // 1. Проверяем текущее состояние
    console.log('\n1️⃣  ТЕКУЩЕЕ СОСТОЯНИЕ');
    console.log('-'.repeat(20));

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Ошибка при получении профилей:', profilesError);
      return;
    }

    console.log(`📊 Всего профилей: ${profiles?.length || 0}`);
    console.log('');

    if (profiles && profiles.length > 0) {
      console.log('📋 Последние 3 профиля:');
      profiles.slice(0, 3).forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.name} (${profile.email})`);
        console.log(`      Роль: ${profile.role}, Создан: ${new Date(profile.created_at).toLocaleString('ru-RU')}`);
      });
    }

    // 2. Инструкции по тестированию
    console.log('\n2️⃣  ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ ТРИГГЕРА');
    console.log('-'.repeat(45));

    console.log('🧪 ДЛЯ ПРОВЕРКИ РАБОТЫ ТРИГГЕРА:');
    console.log('');
    console.log('1. 🌐 Откройте приложение: http://localhost:5173');
    console.log('2. 📝 Нажмите "Нет аккаунта? Зарегистрироваться"');
    console.log('3. ✍️  Заполните форму регистрации:');
    console.log('   - Полное имя: "Тест Триггера"');
    console.log('   - Email: test.trigger@example.com');
    console.log('   - Пароль: (любой, длиной от 6 символов)');
    console.log('4. 🚀 Нажмите "Зарегистрироваться"');
    console.log('');
    console.log('✅ ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:');
    console.log('   - Регистрация пройдет успешно');
    console.log('   - Профиль создастся автоматически через триггер');
    console.log('   - В таблице profiles появится новая запись');
    console.log('');

    // 3. Скрипт для проверки после регистрации
    console.log('3️⃣  ПРОВЕРКА ПОСЛЕ РЕГИСТРАЦИИ');
    console.log('-'.repeat(35));

    console.log('🔄 После регистрации выполните команду:');
    console.log('   npx tsx scripts/checkTriggerTest.ts');
    console.log('');
    console.log('📊 Или проверьте вручную в Supabase Dashboard:');
    console.log('   - Перейдите в Table Editor');
    console.log('   - Откройте таблицу "profiles"');
    console.log('   - Найдите нового пользователя "Тест Триггера"');

    // 4. Альтернативный способ проверки
    console.log('\n4️⃣  АЛЬТЕРНАТИВНАЯ ПРОВЕРКА');
    console.log('-'.repeat(30));

    console.log('🔍 Если хотите проверить сейчас, выполните:');
    console.log('');
    console.log('В SQL Editor Supabase выполните запрос:');
    console.log('```sql');
    console.log('SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;');
    console.log('```');
    console.log('');
    console.log('Затем:');
    console.log('```sql');
    console.log('SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;');
    console.log('```');
    console.log('');
    console.log('🎯 Количество записей должно совпадать для новых пользователей');

    console.log('\n🎉 ГОТОВО К ТЕСТИРОВАНИЮ!');
    console.log('');
    console.log('💡 СОВЕТЫ:');
    console.log('   - Используйте уникальный email для каждого теста');
    console.log('   - Проверьте консоль браузера на ошибки');
    console.log('   - При ошибках проверьте политики RLS в Supabase');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

testTriggerSetup();
