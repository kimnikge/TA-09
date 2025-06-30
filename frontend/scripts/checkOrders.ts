import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
  console.log('🔍 Проверяем заказы в базе данных...\n');

  try {
    // Получаем все заказы (без связей пока)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Ошибка получения заказов:', ordersError);
      return;
    }

    console.log(`📋 Найдено заказов: ${orders?.length || 0}\n`);

    if (orders && orders.length > 0) {
      for (const order of orders) {
        console.log(`🧾 Заказ #${order.id}`);
        console.log(`   📅 Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`);
        console.log(`   👤 ID Менеджера: ${order.rep_id}`);
        console.log(`   🏢 ID Клиента: ${order.client_id}`);
        console.log(`   🚚 Дата доставки: ${order.delivery_date}`);
        console.log(`   📦 Количество позиций: ${order.total_items}`);
        console.log(`   💰 Общая сумма: ${order.total_price?.toLocaleString()} ₸`);
        
        // Получаем информацию о менеджере
        const { data: manager } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', order.rep_id)
          .single();
        
        if (manager) {
          console.log(`   👤 Менеджер: ${manager.name} (${manager.email})`);
        }

        // Получаем информацию о клиенте
        const { data: client } = await supabase
          .from('clients')
          .select('name, company_name, address')
          .eq('id', order.client_id)
          .single();
        
        if (client) {
          console.log(`   🏢 Клиент: ${client.name}`);
          console.log(`   🏭 Компания: ${client.company_name || 'Не указано'}`);
          console.log(`   📍 Адрес: ${client.address || 'Не указан'}`);
        }
        
        // Получаем позиции заказа
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) {
          console.log(`   ❌ Ошибка получения позиций: ${itemsError.message}`);
        } else if (items && items.length > 0) {
          console.log(`   📝 Позиции заказа:`);
          for (const item of items) {
            // Получаем информацию о товаре
            const { data: product } = await supabase
              .from('products')
              .select('name, price, unit')
              .eq('id', item.product_id)
              .single();

            console.log(`      • ${product?.name || 'Неизвестный товар'}`);
            console.log(`        Количество: ${item.quantity} ${item.unit || 'шт'}`);
            console.log(`        Цена: ${item.price?.toLocaleString()} ₸`);
            console.log(`        Сумма: ${(item.price * item.quantity)?.toLocaleString()} ₸`);
            if (item.comment) {
              console.log(`        Комментарий: ${item.comment}`);
            }
          }
        } else {
          console.log(`   ❌ Позиции заказа не найдены`);
        }
        
        console.log(''); // Пустая строка между заказами
      }
    } else {
      console.log('📝 Заказов в базе данных нет');
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkOrders()
  .then(() => {
    console.log('✅ Проверка завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
