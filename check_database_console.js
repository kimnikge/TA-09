// Вставьте этот код в консоль браузера для проверки схемы БД

// Проверяем таблицу orders
console.log('Проверяем структуру таблицы orders...');
supabase.from('orders').select('*').limit(1).then(result => {
  console.log('Orders result:', result);
  if (result.data && result.data.length > 0) {
    console.log('Колонки в orders:', Object.keys(result.data[0]));
  }
  if (result.error) {
    console.log('Ошибка orders:', result.error.message);
  }
});

// Проверяем таблицу clients  
console.log('Проверяем структуру таблицы clients...');
supabase.from('clients').select('*').limit(1).then(result => {
  console.log('Clients result:', result);
  if (result.data && result.data.length > 0) {
    console.log('Колонки в clients:', Object.keys(result.data[0]));
  }
});

// Проверяем таблицу products
console.log('Проверяем структуру таблицы products...');
supabase.from('products').select('*').limit(1).then(result => {
  console.log('Products result:', result);
  if (result.data && result.data.length > 0) {
    console.log('Колонки в products:', Object.keys(result.data[0]));
  }
});
