const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function seed() {
  // Примеры клиентов (без поля phone)
  const clients = [
    { name: 'ООО Ромашка', address: 'г. Москва, ул. Ленина, 1' },
    { name: 'ИП Иванов', address: 'г. Санкт-Петербург, пр. Мира, 10' },
    { name: 'ООО Лотос', address: 'г. Казань, ул. Пушкина, 5' },
  ];
  // Примеры товаров
  const products = [
    { name: 'Товар А', price: 100 },
    { name: 'Товар Б', price: 200 },
    { name: 'Товар В', price: 350 },
  ];

  // Вставка клиентов
  const { error: clientError } = await supabase.from('clients').insert(clients);
  if (clientError) {
    console.error('Ошибка при добавлении клиентов:', clientError);
  } else {
    console.log('Клиенты успешно добавлены');
  }

  // Вставка товаров
  const { error: productError } = await supabase.from('products').insert(products);
  if (productError) {
    console.error('Ошибка при добавлении товаров:', productError);
  } else {
    console.log('Товары успешно добавлены');
  }
}

seed().then(() => process.exit(0));
