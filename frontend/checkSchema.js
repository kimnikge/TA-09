import { supabase } from './src/supabaseClient.ts';

const checkDatabaseSchema = async () => {
  console.log('🔍 Проверяем схему базы данных...');
  
  try {
    // Проверяем таблицу clients
    console.log('\n📋 Проверяем таблицу clients:');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      console.error('❌ Ошибка clients:', clientsError.message);
    } else {
      console.log('✅ Таблица clients доступна');
      if (clientsData && clientsData.length > 0) {
        console.log('📊 Колонки clients:', Object.keys(clientsData[0]));
      }
    }

    // Проверяем таблицу orders
    console.log('\n📋 Проверяем таблицу orders:');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('❌ Ошибка orders:', ordersError.message);
    } else {
      console.log('✅ Таблица orders доступна');
      if (ordersData && ordersData.length > 0) {
        console.log('📊 Колонки orders:', Object.keys(ordersData[0]));
      }
    }

    // Проверяем таблицу products
    console.log('\n📋 Проверяем таблицу products:');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.error('❌ Ошибка products:', productsError.message);
    } else {
      console.log('✅ Таблица products доступна');
      if (productsData && productsData.length > 0) {
        console.log('📊 Колонки products:', Object.keys(productsData[0]));
      }
    }

  } catch (error) {
    console.error('💥 Непредвиденная ошибка:', error);
  }
};

checkDatabaseSchema();
