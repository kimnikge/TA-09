#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStatusUpdate() {
  console.log('🧪 ТЕСТ ОБНОВЛЕНИЯ СТАТУСА АГЕНТОВ\n');
  console.log('=' .repeat(45));

  try {
    // 1. Получаем всех агентов
    console.log('\n1️⃣  ПОЛУЧЕНИЕ АГЕНТОВ');
    console.log('-'.repeat(25));

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
    
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} (${agent.email}) - ${agent.approved ? '✅ Активен' : '🔒 Заблокирован'}`);
    });

    // 2. Выбираем агента для тестирования
    const testAgent = agents[0];
    console.log(`\n2️⃣  ТЕСТИРОВАНИЕ С АГЕНТОМ: ${testAgent.name}`);
    console.log('-'.repeat(40));
    
    console.log(`📋 Текущий статус: ${testAgent.approved ? 'Активен' : 'Заблокирован'}`);
    
    // 3. Меняем статус
    const newStatus = !testAgent.approved;
    console.log(`🔄 Меняем статус на: ${newStatus ? 'Активен' : 'Заблокирован'}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ approved: newStatus })
      .eq('id', testAgent.id)
      .select();

    if (updateError) {
      console.error('❌ Ошибка при обновлении:', updateError);
      return;
    }

    console.log('✅ Обновление выполнено успешно');
    console.log('📋 Результат обновления:', updateResult);

    // 4. Проверяем изменения
    console.log('\n3️⃣  ПРОВЕРКА ИЗМЕНЕНИЙ');
    console.log('-'.repeat(25));

    const { data: updatedAgent, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testAgent.id)
      .single();

    if (checkError) {
      console.error('❌ Ошибка при проверке:', checkError);
      return;
    }

    console.log(`📋 Новый статус: ${updatedAgent.approved ? '✅ Активен' : '🔒 Заблокирован'}`);
    
    if (updatedAgent.approved === newStatus) {
      console.log('✅ Статус изменен корректно!');
    } else {
      console.log('❌ Статус не изменился!');
      console.log(`   Ожидали: ${newStatus}`);
      console.log(`   Получили: ${updatedAgent.approved}`);
    }

    // 5. Возвращаем исходный статус
    console.log('\n4️⃣  ВОЗВРАТ ИСХОДНОГО СТАТУСА');
    console.log('-'.repeat(30));

    await supabase
      .from('profiles')
      .update({ approved: testAgent.approved })
      .eq('id', testAgent.id);

    console.log('✅ Исходный статус восстановлен');

    // 6. Итоговая проверка всех агентов
    console.log('\n5️⃣  ИТОГОВОЕ СОСТОЯНИЕ ВСЕХ АГЕНТОВ');
    console.log('-'.repeat(40));

    const { data: finalAgents } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep')
      .order('created_at', { ascending: false });

    if (finalAgents) {
      finalAgents.forEach((agent, index) => {
        const status = agent.approved ? '✅ Активен' : '🔒 Заблокирован';
        console.log(`${index + 1}. ${agent.name} (${agent.email}) - ${status}`);
      });
    }

    console.log('\n🎉 ТЕСТ ЗАВЕРШЕН УСПЕШНО!');
    console.log('');
    console.log('💡 ЕСЛИ ПРОБЛЕМЫ ОСТАЮТСЯ:');
    console.log('   1. Проверьте консоль браузера на ошибки');
    console.log('   2. Убедитесь, что вы авторизованы как администратор');
    console.log('   3. Попробуйте обновить страницу после изменения статуса');
    console.log('   4. Проверьте политики RLS в Supabase');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запускаем тест
testStatusUpdate();
