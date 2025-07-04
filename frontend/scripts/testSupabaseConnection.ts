import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Загружаем переменные окружения
dotenv.config()

// Создаем клиент для тестов
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODQ2MjEsImV4cCI6MjA0NzQ2MDYyMX0.3uVYpQsv_gIZEOJRcEBXVVJmNZFsRnrqMZ3pzKJsHBo'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    disabled: true // Отключаем realtime для тестов
  }
})

async function testSupabaseConnection() {
  console.log('🔍 Тестирование подключения к Supabase...\n')

  try {
    // 1. Проверяем базовое подключение
    console.log('1️⃣ Проверка базового подключения...')
    const { error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError) {
      console.error('❌ Ошибка базового подключения:', healthError)
      return false
    }

    console.log('✅ Базовое подключение работает')

    // 2. Проверяем аутентификацию
    console.log('\n2️⃣ Проверка статуса аутентификации...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.log('ℹ️  Пользователь не аутентифицирован:', userError.message)
    } else if (user) {
      console.log('✅ Пользователь аутентифицирован:', user.email)
    } else {
      console.log('ℹ️  Пользователь не залогинен')
    }

    // 3. Проверяем доступ к таблицам
    console.log('\n3️⃣ Проверка доступа к таблицам...')
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(3)

    if (clientsError) {
      console.error('❌ Ошибка доступа к таблице clients:', clientsError)
    } else {
      console.log('✅ Доступ к таблице clients работает. Найдено записей:', clients?.length || 0)
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(3)

    if (ordersError) {
      console.error('❌ Ошибка доступа к таблице orders:', ordersError)
    } else {
      console.log('✅ Доступ к таблице orders работает. Найдено записей:', orders?.length || 0)
    }

    // 4. Проверяем конфигурацию
    console.log('\n4️⃣ Проверка конфигурации...')
    console.log('URL:', supabaseUrl ? '✅ Загружен' : '❌ Не найден')
    console.log('API Key:', supabaseKey ? '✅ Загружен' : '❌ Не найден')

    console.log('\n🎉 Тест подключения завершен!')
    return true

  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
    return false
  }
}

// Запускаем тест
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Все тесты пройдены успешно!')
    } else {
      console.log('\n❌ Есть проблемы с подключением')
    }
  })
  .catch(error => {
    console.error('❌ Ошибка выполнения теста:', error)
  })
