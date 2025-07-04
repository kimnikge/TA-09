import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testClientAndOrderCreation() {
  console.log('🧪 Тестирование создания клиента и заказа...\n')

  try {
    // 1. Получаем торгового представителя
    console.log('1️⃣ Поиск торгового представителя...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales_rep')
      .limit(1)

    if (profilesError) {
      throw new Error(`Ошибка получения торгового представителя: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('Не найден ни один торговый представитель')
    }

    const salesRep = profiles[0]
    console.log(`✅ Найден торговый представитель: ${salesRep.name} (${salesRep.email})`)

    // 2. Создаем тестового клиента
    console.log('\n2️⃣ Создание тестового клиента...')
    const testClientName = `Тестовый клиент ${Date.now()}`
    const testClientAddress = 'ул. Тестовая, д. 123'

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          name: testClientName,
          address: testClientAddress,
          created_by: salesRep.id
        }
      ])
      .select()
      .single()

    if (clientError) {
      throw new Error(`Ошибка создания клиента: ${clientError.message}`)
    }

    console.log(`✅ Клиент создан: ${newClient.name} (ID: ${newClient.id})`)

    // 3. Получаем товары для заказа
    console.log('\n3️⃣ Получение товаров...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .limit(2)

    if (productsError) {
      throw new Error(`Ошибка получения товаров: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      throw new Error('Не найдено активных товаров')
    }

    console.log(`✅ Найдено товаров: ${products.length}`)
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ${product.price} руб.`)
    })

    // 4. Создаем заказ
    console.log('\n4️⃣ Создание заказа...')
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 1)

    const totalItems = products.length
    const totalPrice = products.reduce((sum, product) => sum + product.price, 0)

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          rep_id: salesRep.id,
          client_id: newClient.id,
          delivery_date: deliveryDate.toISOString().split('T')[0],
          total_items: totalItems,
          total_price: totalPrice
        }
      ])
      .select()
      .single()

    if (orderError) {
      throw new Error(`Ошибка создания заказа: ${orderError.message}`)
    }

    console.log(`✅ Заказ создан: ID ${newOrder.id}`)

    // 5. Добавляем позиции заказа
    console.log('\n5️⃣ Добавление позиций заказа...')
    const orderItems = products.map(product => ({
      order_id: newOrder.id,
      product_id: product.id,
      quantity: 1,
      price: product.price,
      unit: product.unit || 'шт',
      comment: `Тестовая позиция для ${product.name}`
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      throw new Error(`Ошибка добавления позиций: ${itemsError.message}`)
    }

    console.log(`✅ Добавлено позиций: ${orderItems.length}`)

    // 6. Проверяем созданный заказ
    console.log('\n6️⃣ Проверка созданного заказа...')
    const { data: orderCheck, error: orderCheckError } = await supabase
      .from('orders')
      .select(`
        *,
        clients(name, address),
        order_items(*, products(name, price))
      `)
      .eq('id', newOrder.id)
      .single()

    if (orderCheckError) {
      throw new Error(`Ошибка проверки заказа: ${orderCheckError.message}`)
    }

    // Получаем информацию о торговом представителе отдельно
    const { data: repInfo } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', orderCheck.rep_id)
      .single()

    console.log('\n✅ ЗАКАЗ УСПЕШНО СОЗДАН:')
    console.log(`   Заказ ID: ${orderCheck.id}`)
    console.log(`   Клиент: ${orderCheck.clients?.name}`)
    console.log(`   Адрес: ${orderCheck.clients?.address}`)
    console.log(`   Торговый представитель: ${repInfo?.name || 'Не найден'}`)
    console.log(`   Дата доставки: ${orderCheck.delivery_date}`)
    console.log(`   Общая стоимость: ${orderCheck.total_price} руб.`)
    console.log(`   Позиций в заказе: ${orderCheck.order_items?.length}`)

    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!')
    
  } catch (error) {
    console.error('\n❌ ОШИБКА ТЕСТИРОВАНИЯ:', error)
    process.exit(1)
  }
}

// Запускаем тест
testClientAndOrderCreation()
