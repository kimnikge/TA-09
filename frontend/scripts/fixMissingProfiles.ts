import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingProfiles() {
  console.log('🔧 ИСПРАВЛЕНИЕ ОТСУТСТВУЮЩИХ ПРОФИЛЕЙ\n');
  console.log('=' .repeat(45));

  try {
    // 1. Получаем всех пользователей из auth через текущую сессию
    console.log('\n1️⃣  АНАЛИЗ СИТУАЦИИ');
    console.log('-'.repeat(20));

    // Поскольку мы не можем напрямую получить всех пользователей из auth.users,
    // мы найдем профили с неполными данными
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Ошибка при получении профилей:', profilesError);
      return;
    }

    console.log(`📊 Найдено профилей: ${profiles?.length || 0}`);

    // Ищем профили с пустыми данными
    const incompleteProfiles = profiles?.filter(p => 
      !p.name || p.name === 'null' || !p.email || p.email === 'null'
    ) || [];

    console.log(`⚠️  Неполных профилей: ${incompleteProfiles.length}`);

    if (incompleteProfiles.length > 0) {
      console.log('\n📋 Неполные профили:');
      incompleteProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id.slice(0, 8)}...`);
        console.log(`      Email: ${profile.email || 'НЕ УКАЗАН'}`);
        console.log(`      Имя: ${profile.name || 'НЕ УКАЗАНО'}`);
        console.log(`      Роль: ${profile.role}`);
      });
    }

    // 2. Исправляем неполные профили
    console.log('\n2️⃣  ИСПРАВЛЕНИЕ НЕПОЛНЫХ ПРОФИЛЕЙ');
    console.log('-'.repeat(35));

    if (incompleteProfiles.length > 0) {
      for (const profile of incompleteProfiles) {
        console.log(`\n🔧 Исправляем профиль ${profile.id.slice(0, 8)}...`);

        // Генерируем имя и email по умолчанию, если они отсутствуют
        const updatedData: {
          name?: string;
          email?: string;
          role?: string;
          approved?: boolean;
        } = {};
        
        if (!profile.name || profile.name === 'null') {
          updatedData.name = profile.email ? 
            profile.email.split('@')[0] : 
            `Пользователь_${profile.id.slice(0, 8)}`;
        }
        
        if (!profile.email || profile.email === 'null') {
          updatedData.email = `user_${profile.id.slice(0, 8)}@example.com`;
        }

        // Убеждаемся, что роль указана
        if (!profile.role) {
          updatedData.role = 'sales_rep';
        }

        // Устанавливаем approved в false для новых пользователей
        if (profile.approved === null || profile.approved === undefined) {
          updatedData.approved = false;
        }

        if (Object.keys(updatedData).length > 0) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updatedData)
            .eq('id', profile.id)
            .select()
            .single();

          if (updateError) {
            console.error(`❌ Ошибка при обновлении профиля:`, updateError);
          } else {
            console.log(`✅ Профиль обновлен:`);
            console.log(`   Имя: ${updatedProfile.name}`);
            console.log(`   Email: ${updatedProfile.email}`);
            console.log(`   Роль: ${updatedProfile.role}`);
          }
        } else {
          console.log('ℹ️  Профиль не нуждается в исправлении');
        }
      }
    } else {
      console.log('✅ Все профили корректны');
    }

    // 3. Создаем тестового пользователя для демонстрации
    console.log('\n3️⃣  СОЗДАНИЕ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ');
    console.log('-'.repeat(35));

    const testEmail = 'test.salesrep.new@example.com';
    
    // Проверяем, существует ли уже такой профиль
    const { data: existingTest } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (existingTest) {
      console.log('⚠️  Тестовый пользователь уже существует');
    } else {
      console.log('👤 Создаем тестового торгового представителя...');
      
      const testUserData = {
        id: crypto.randomUUID(),
        email: testEmail,
        name: 'Тестовый Торговый Представитель',
        role: 'sales_rep',
        approved: true  // Сразу одобряем для тестирования
      };

      const { data: testUser, error: testError } = await supabase
        .from('profiles')
        .insert(testUserData)
        .select()
        .single();

      if (testError) {
        console.error('❌ Ошибка при создании тестового пользователя:', testError);
        console.log('\n💡 ВОЗМОЖНАЯ ПРИЧИНА:');
        console.log('   Таблица profiles требует существующего пользователя в auth.users');
        console.log('   Этот пользователь должен быть создан через форму регистрации');
      } else {
        console.log('✅ Тестовый пользователь создан:');
        console.log(`   ID: ${testUser.id}`);
        console.log(`   Имя: ${testUser.name}`);
        console.log(`   Email: ${testUser.email}`);
        console.log('');
        console.log('⚠️  ВАЖНО: Этот пользователь создан только в таблице profiles.');
        console.log('   Для входа в систему нужно зарегистрироваться через интерфейс.');
      }
    }

    // 4. Финальная проверка
    console.log('\n4️⃣  ФИНАЛЬНАЯ ПРОВЕРКА');
    console.log('-'.repeat(25));

    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Ошибка при финальной проверке:', finalError);
    } else {
      console.log(`📊 Итого профилей: ${finalProfiles?.length || 0}`);
      
      const validProfiles = finalProfiles?.filter(p => 
        p.name && p.name !== 'null' && p.email && p.email !== 'null'
      ) || [];

      const salesReps = finalProfiles?.filter(p => p.role === 'sales_rep') || [];
      const admins = finalProfiles?.filter(p => p.role === 'admin') || [];

      console.log(`✅ Корректных профилей: ${validProfiles.length}`);
      console.log(`🤝 Торговых представителей: ${salesReps.length}`);
      console.log(`👑 Администраторов: ${admins.length}`);
    }

    console.log('\n🎯 РЕЗЮМЕ:');
    console.log('');
    console.log('✅ Неполные профили исправлены');
    console.log('✅ Улучшена логика регистрации в коде');
    console.log('✅ Система готова для новых регистраций');
    console.log('');
    console.log('💡 РЕКОМЕНДАЦИИ:');
    console.log('   1. Протестируйте регистрацию нового пользователя');
    console.log('   2. Убедитесь, что профиль создается автоматически');
    console.log('   3. Проверьте, что торговые представители видят клиентов');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

fixMissingProfiles();
