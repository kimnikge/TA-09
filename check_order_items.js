const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjI0NTYsImV4cCI6MjA0ODE5ODQ1Nn0.VoGWyYo7gGFbf7LfJu5xq_0qJkp6IH1QbC5OQBXS4BM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderItems() {
  console.log('🔍 Проверка таблицы order_items...');
  
  try {
    // Проверяем заказы
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    if (ordersError) {
      console.error('❌ Ошибка загрузки заказов:', ordersError);
      return;
    }
    
    console.log('📦 Найдено заказов:', orders?.length || 0);
    if (orders && orders.length > 0) {
      console.log('🔍 Первый заказ:', orders[0]);
      console.log('🆔 ID заказа:', orders[0].id);
      
      // Проверяем order_items для всех заказов
      const orderIds = orders.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (itemsError) {
        console.error('❌ Ошибка загрузки позиций заказа:', itemsError);
        return;
      }
      
      console.log('📋 Всего позиций для этих заказов:', items?.length || 0);
      if (items && items.length > 0) {
        console.log('🎯 Первая позиция:', items[0]);
      } else {
        console.log('⚠️  Позиции заказов не найдены!');
        
        // Проверим, существует ли таблица order_items
        const { data: tableInfo, error: tableError } = await supabase
          .from('order_items')
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.error('❌ Таблица order_items недоступна:', tableError);
        } else {
          console.log('✅ Таблица order_items существует, но пуста');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

checkOrderItems();
