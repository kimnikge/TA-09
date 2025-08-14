import { supabase } from '../src/supabaseClient';

async function checkOrderItems() {
  console.log('🔍 Проверка таблицы order_items...');
  
  try {
    // Проверяем структуру таблицы order_items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Ошибка загрузки заказов:', ordersError);
      return;
    }
    
    console.log('📦 Найдено заказов:', orders?.length || 0);
    if (orders && orders.length > 0) {
      console.log('🔍 Первый заказ:', orders[0]);
      
      // Проверяем order_items для первого заказа
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orders[0].id);
      
      if (itemsError) {
        console.error('❌ Ошибка загрузки позиций заказа:', itemsError);
        return;
      }
      
      console.log('📋 Позиции заказа:', items?.length || 0);
      if (items && items.length > 0) {
        console.log('🎯 Первая позиция:', items[0]);
      } else {
        console.log('⚠️  Позиции заказа не найдены!');
      }
    }
    
    // Проверим общее количество order_items
    const { count, error: countError } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Ошибка подсчета order_items:', countError);
    } else {
      console.log(`📊 Всего записей в order_items: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

checkOrderItems();
