import { supabase } from '../src/supabaseClient';

const checkOrdersTable = async () => {
  console.log('🔍 Проверяем структуру таблицы orders...');
  
  try {
    // Пытаемся получить первую запись из таблицы orders
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка при доступе к таблице orders:', error.message);
      
      if (error.message.includes('relation "public.orders" does not exist')) {
        console.log('📋 Таблица orders не существует. Создаем...');
        
        // Создаем таблицу orders
        const { error: createError } = await supabase.rpc('create_orders_table');
        
        if (createError) {
          console.error('❌ Ошибка при создании таблицы:', createError);
        } else {
          console.log('✅ Таблица orders создана успешно');
        }
      }
    } else {
      console.log('✅ Таблица orders доступна');
      console.log('📊 Структура данных:', data);
    }

    // Пытаемся создать тестовый заказ
    console.log('🧪 Пробуем создать тестовый заказ...');
    
    const testOrder = {
      client_id: 'test-client-id',
      total_amount: 1000,
      status: 'pending',
      items: [
        {
          product_id: 'test-product',
          product_name: 'Тестовый товар',
          price: 100,
          quantity: 10,
          unit: 'шт',
          comment: 'Тестовый комментарий'
        }
      ]
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Ошибка при создании тестового заказа:', orderError.message);
      console.log('🔧 Нужно исправить структуру таблицы или код');
    } else {
      console.log('✅ Тестовый заказ создан успешно!');
      console.log('📋 Данные заказа:', orderData);
      
      // Удаляем тестовый заказ
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderData.id);
      
      console.log('🗑️ Тестовый заказ удален');
    }

  } catch (error) {
    console.error('💥 Непредвиденная ошибка:', error);
  }
};

checkOrdersTable();
