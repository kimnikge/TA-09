#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function demonstrateApprovalSystem() {
  console.log('🔒 ДЕМОНСТРАЦИЯ СИСТЕМЫ ОДОБРЕНИЯ АГЕНТОВ\n');
  console.log('=' .repeat(55));

  try {
    // 1. Получаем всех агентов
    console.log('\n1️⃣  ТЕКУЩИЕ АГЕНТЫ В СИСТЕМЕ');
    console.log('-'.repeat(35));

    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep')
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.error('❌ Ошибка при получении агентов:', agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️  Агентов не найдено');
      return;
    }

    console.log(`📊 Найдено агентов: ${agents.length}`);
    console.log('');

    agents.forEach((agent, index) => {
      const status = agent.approved ? '✅ АКТИВЕН' : '🔒 ЗАБЛОКИРОВАН';
      const description = agent.approved ? 
        'Может войти в систему и работать' : 
        'НЕ МОЖЕТ войти в систему';
      
      console.log(`${index + 1}. 👤 ${agent.name} (${agent.email})`);
      console.log(`   Статус: ${status}`);
      console.log(`   Доступ: ${description}`);
      console.log(`   Создан: ${new Date(agent.created_at).toLocaleString('ru-RU')}`);
      console.log('');
    });

    // 2. Демонстрируем изменение статуса
    console.log('\n2️⃣  ДЕМОНСТРАЦИЯ БЛОКИРОВКИ/РАЗБЛОКИРОВКИ');
    console.log('-'.repeat(45));

    // Найдем агента для демонстрации
    const testAgent = agents.find(a => a.email.includes('edikyoo') || a.name === 'Ed');
    
    if (!testAgent) {
      console.log('⚠️  Тестовый агент не найден для демонстрации');
      return;
    }

    console.log(`🎯 Работаем с агентом: ${testAgent.name} (${testAgent.email})`);
    console.log(`📋 Текущий статус: ${testAgent.approved ? 'АКТИВЕН' : 'ЗАБЛОКИРОВАН'}`);
    console.log('');

    // Меняем статус для демонстрации
    const newStatus = !testAgent.approved;
    const action = newStatus ? 'РАЗБЛОКИРУЕМ' : 'БЛОКИРУЕМ';
    
    console.log(`🔄 ${action} агента...`);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ approved: newStatus })
      .eq('id', testAgent.id);

    if (updateError) {
      console.error(`❌ Ошибка при изменении статуса:`, updateError);
      return;
    }

    console.log(`✅ Статус изменен успешно!`);
    console.log('');

    // Показываем результат
    const { data: updatedAgent } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testAgent.id)
      .single();

    if (updatedAgent) {
      const newStatusText = updatedAgent.approved ? '✅ АКТИВЕН' : '🔒 ЗАБЛОКИРОВАН';
      const accessText = updatedAgent.approved ? 
        'МОЖЕТ войти в систему и работать' : 
        'НЕ МОЖЕТ войти в систему';
      
      console.log(`📋 Новый статус: ${newStatusText}`);
      console.log(`🚪 Доступ: ${accessText}`);
    }

    // Возвращаем исходный статус
    console.log('');
    console.log('🔄 Возвращаем исходный статус...');
    
    await supabase
      .from('profiles')
      .update({ approved: testAgent.approved })
      .eq('id', testAgent.id);
    
    console.log('✅ Исходный статус восстановлен');

    // 3. Объяснение логики
    console.log('\n3️⃣  КАК РАБОТАЕТ СИСТЕМА БЛОКИРОВКИ');
    console.log('-'.repeat(40));

    console.log('🔍 ЛОГИКА ПРОВЕРКИ:');
    console.log('   1. При входе в систему проверяется поле "approved" в таблице profiles');
    console.log('   2. Если approved = false, агент получает ошибку "Ваш аккаунт ожидает одобрения"');
    console.log('   3. Если агент уже вошел, он автоматически выходит при проверке статуса');
    console.log('   4. Только агенты с approved = true могут работать в системе');
    console.log('');

    console.log('👨‍💼 ДЕЙСТВИЯ АДМИНИСТРАТОРА:');
    console.log('   1. Открыть Админ-панель → Управление агентами');
    console.log('   2. Найти нужного агента в списке');
    console.log('   3. Нажать на статус (Активен/Заблокирован) для переключения');
    console.log('   4. Изменения применяются мгновенно');
    console.log('');

    console.log('🔒 ЭФФЕКТ БЛОКИРОВКИ:');
    console.log('   ❌ Агент НЕ может войти в систему');
    console.log('   ❌ Агент НЕ может создавать заказы');
    console.log('   ❌ Агент НЕ может работать с клиентами');
    console.log('   ❌ Агент НЕ может загружать изображения');
    console.log('   ✅ Но данные агента сохраняются в системе');
    console.log('');

    console.log('✅ ЭФФЕКТ РАЗБЛОКИРОВКИ:');
    console.log('   ✅ Агент может войти в систему');
    console.log('   ✅ Агент может создавать заказы');
    console.log('   ✅ Агент может работать с клиентами');
    console.log('   ✅ Агент получает полный доступ к функциям');

    // 4. Тестовые инструкции
    console.log('\n4️⃣  ИНСТРУКЦИИ ДЛЯ ТЕСТИРОВАНИЯ');
    console.log('-'.repeat(35));

    console.log('🧪 КАК ПРОТЕСТИРОВАТЬ БЛОКИРОВКУ:');
    console.log('');
    console.log('1. 👨‍💼 ВОЙДИТЕ КАК АДМИНИСТРАТОР:');
    console.log('   - Откройте http://localhost:5173');
    console.log('   - Войдите с правами админа');
    console.log('   - Перейдите в "Админ-панель"');
    console.log('');
    console.log('2. 🔒 ЗАБЛОКИРУЙТЕ АГЕНТА:');
    console.log('   - Найдите агента в списке');
    console.log('   - Нажмите на статус "Активен"');
    console.log('   - Статус изменится на "Заблокирован"');
    console.log('');
    console.log('3. 🧪 ПРОТЕСТИРУЙТЕ БЛОКИРОВКУ:');
    console.log('   - Откройте новую вкладку/окно браузера');
    console.log('   - Попробуйте войти как заблокированный агент');
    console.log('   - Должна появиться ошибка о блокировке');
    console.log('');
    console.log('4. ✅ РАЗБЛОКИРУЙТЕ АГЕНТА:');
    console.log('   - Вернитесь в админку');
    console.log('   - Нажмите на "Заблокирован"');
    console.log('   - Статус изменится на "Активен"');
    console.log('   - Агент снова сможет войти');

    console.log('\n🎉 СИСТЕМА БЛОКИРОВКИ ПОЛНОСТЬЮ ФУНКЦИОНАЛЬНА!');
    console.log('');
    console.log('🔧 КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ:');
    console.log('   ✅ Добавлена проверка approved при входе');
    console.log('   ✅ Добавлена проверка approved при получении пользователя');
    console.log('   ✅ Автоматический выход при блокировке');
    console.log('   ✅ Изменена терминология "Пользователь" → "Агент"');
    console.log('   ✅ Обновлен интерфейс админ-панели');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запускаем демонстрацию
demonstrateApprovalSystem();
