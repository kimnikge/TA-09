#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPolicies() {
  console.log('🔒 ТЕСТ ПОЛИТИК RLS ДЛЯ ОБНОВЛЕНИЯ СТАТУСА\n');
  console.log('=' .repeat(50));

  try {
    // 1. Проверяем авторизацию
    console.log('\n1️⃣  ПРОВЕРКА АВТОРИЗАЦИИ');
    console.log('-'.repeat(30));

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Пользователь не авторизован');
      console.log('💡 Для тестирования нужно войти в систему как администратор');
      return;
    }

    console.log(`✅ Авторизован: ${user.email} (ID: ${user.id})`);

    // 2. Проверяем роль текущего пользователя
    console.log('\n2️⃣  ПРОВЕРКА РОЛИ ПОЛЬЗОВАТЕЛЯ');
    console.log('-'.repeat(35));

    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Ошибка получения профиля:', profileError);
      return;
    }

    console.log(`👤 Имя: ${currentProfile.name}`);
    console.log(`📧 Email: ${currentProfile.email}`);
    console.log(`🏷️  Роль: ${currentProfile.role}`);
    console.log(`✅ Статус: ${currentProfile.approved ? 'Активен' : 'Заблокирован'}`);

    if (currentProfile.role !== 'admin') {
      console.log('');
      console.log('⚠️  ВНИМАНИЕ: Вы не администратор!');
      console.log('   Политики RLS могут блокировать обновление других профилей');
      console.log('   Для полного тестирования войдите как администратор');
    }

    // 3. Получаем список агентов для тестирования
    console.log('\n3️⃣  ПОЛУЧЕНИЕ АГЕНТОВ ДЛЯ ТЕСТИРОВАНИЯ');
    console.log('-'.repeat(40));

    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep');

    if (agentsError) {
      console.error('❌ Ошибка получения агентов:', agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️  Агентов не найдено');
      return;
    }

    console.log(`📊 Найдено агентов: ${agents.length}`);
    const testAgent = agents[0];
    console.log(`🎯 Тестируем с агентом: ${testAgent.name} (${testAgent.email})`);

    // 4. Тестируем обновление статуса
    console.log('\n4️⃣  ТЕСТ ОБНОВЛЕНИЯ СТАТУСА');
    console.log('-'.repeat(30));

    const originalStatus = testAgent.approved;
    const newStatus = !originalStatus;
    
    console.log(`📋 Текущий статус агента: ${originalStatus ? 'Активен' : 'Заблокирован'}`);
    console.log(`🔄 Пытаемся изменить на: ${newStatus ? 'Активен' : 'Заблокирован'}`);

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ approved: newStatus })
      .eq('id', testAgent.id)
      .select();

    if (updateError) {
      console.error('❌ Ошибка обновления:', updateError);
      console.log('');
      console.log('🔍 ВОЗМОЖНЫЕ ПРИЧИНЫ:');
      console.log('   1. Политики RLS блокируют обновление');
      console.log('   2. Недостаточно прав у текущего пользователя');
      console.log('   3. Неправильная настройка политик безопасности');
      console.log('');
      console.log('💡 РЕШЕНИЕ:');
      console.log('   Выполните SQL скрипт FIX_RLS_POLICIES.sql в Supabase');
      return;
    }

    console.log('✅ Запрос выполнен без ошибок');
    console.log(`📋 Результат обновления: ${JSON.stringify(updateResult, null, 2)}`);

    if (!updateResult || updateResult.length === 0) {
      console.log('⚠️  Результат пустой - возможно, политики RLS блокируют обновление');
    }

    // 5. Проверяем фактическое изменение
    console.log('\n5️⃣  ПРОВЕРКА ФАКТИЧЕСКОГО ИЗМЕНЕНИЯ');
    console.log('-'.repeat(40));

    const { data: updatedAgent, error: checkError } = await supabase
      .from('profiles')
      .select('approved')
      .eq('id', testAgent.id)
      .single();

    if (checkError) {
      console.error('❌ Ошибка проверки:', checkError);
      return;
    }

    const actualStatus = updatedAgent.approved;
    console.log(`📋 Фактический статус: ${actualStatus ? 'Активен' : 'Заблокирован'}`);

    if (actualStatus === newStatus) {
      console.log('✅ Статус изменен успешно!');
    } else {
      console.log('❌ Статус НЕ изменился!');
      console.log(`   Ожидали: ${newStatus ? 'Активен' : 'Заблокирован'}`);
      console.log(`   Получили: ${actualStatus ? 'Активен' : 'Заблокирован'}`);
    }

    // 6. Возвращаем исходный статус
    if (actualStatus === newStatus) {
      console.log('\n6️⃣  ВОЗВРАТ ИСХОДНОГО СТАТУСА');
      console.log('-'.repeat(30));

      await supabase
        .from('profiles')
        .update({ approved: originalStatus })
        .eq('id', testAgent.id);

      console.log('✅ Исходный статус восстановлен');
    }

    // 7. Рекомендации
    console.log('\n7️⃣  РЕКОМЕНДАЦИИ');
    console.log('-'.repeat(20));

    if (currentProfile.role === 'admin') {
      console.log('✅ Вы администратор - должны иметь права на обновление');
      if (actualStatus !== newStatus) {
        console.log('🔧 Выполните SQL скрипт FIX_RLS_POLICIES.sql для исправления политик');
      }
    } else {
      console.log('⚠️  Войдите как администратор для полного тестирования');
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

// Запускаем тест
testRLSPolicies();
