import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersStructure() {
  console.log('🔍 Проверяем структуру таблиц заказов...\n');

  // Проверяем таблицу orders
  console.log('📋 Таблица orders:');
  try {
    const { error } = await supabase
      .from('orders')
      .select('*')
      .limit(0);
    
    if (error) {
      console.log('❌ Ошибка orders:', error.message);
    } else {
      console.log('✅ Таблица orders доступна');
    }
  } catch (err) {
    console.log('❌ Критическая ошибка orders:', err);
  }

  // Проверяем таблицу order_items
  console.log('\n📋 Таблица order_items:');
  try {
    const { error } = await supabase
      .from('order_items')
      .select('*')
      .limit(0);
    
    if (error) {
      console.log('❌ Ошибка order_items:', error.message);
    } else {
      console.log('✅ Таблица order_items доступна');
    }
  } catch (err) {
    console.log('❌ Критическая ошибка order_items:', err);
  }

  // Тестируем создание заказа с корректными типами
  console.log('\n🧪 Тестируем создание заказа...');
  try {
    const testOrder = {
      rep_id: 'a0fc8606-9785-4f43-b2a1-2147bcee3a6a', // UUID из profiles
      client_id: '9562fc55-a257-452f-a29f-54a2ecb1af1c', // UUID из clients
      delivery_date: '2025-07-01',
      total_items: 1,
      total_price: 100,
    };
    
    console.log('Тестовые данные:', testOrder);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Ошибка создания тестового заказа:', error);
    } else {
      console.log('✅ Тестовый заказ создан:', data);
      
      // Удаляем тестовый заказ
      await supabase.from('orders').delete().eq('id', data.id);
      console.log('🗑️ Тестовый заказ удален');
    }
  } catch (err) {
    console.log('❌ Критическая ошибка тестирования:', err);
  }
}

checkOrdersStructure()
  .then(() => {
    console.log('\n✅ Проверка завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
