import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Читаем .env файл
const envPath = path.join(process.cwd(), '.env')
const envFile = fs.readFileSync(envPath, 'utf8')

const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

// Конфигурация Supabase
const supabaseUrl = env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedDatabase() {
  console.log('🌱 Инициализация базы данных...')

  const adminEmail = 'admin@ta09.com'
  const adminPassword = 'admin123'

  try {
    // 1. Проверяем, есть ли уже админ
    console.log('👑 Проверка админа...')
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single()
    
    if (existingProfile) {
      console.log('✅ Админ уже существует')
    } else {
      console.log('📝 Создание нового админа...')
      console.log('⚠️ Необходимо зарегистрировать админа через интерфейс приложения')
      console.log(`📧 Email для регистрации: ${adminEmail}`)
      console.log(`🔑 Пароль для регистрации: ${adminPassword}`)
      console.log('🔄 После регистрации запустите этот скрипт снова для обновления роли')
    }

    // 2. Создаем тестовые продукты (если их нет)
    console.log('📦 Проверка тестовых продуктов...')
    
    const { data: existingProducts } = await supabase
      .from('products')
      .select('*')
    
    if (!existingProducts || existingProducts.length === 0) {
      const products = [
        { name: 'Товар 1', price: 100, description: 'Описание товара 1' },
        { name: 'Товар 2', price: 200, description: 'Описание товара 2' },
        { name: 'Товар 3', price: 300, description: 'Описание товара 3' },
        { name: 'Товар 4', price: 400, description: 'Описание товара 4' },
        { name: 'Товар 5', price: 500, description: 'Описание товара 5' },
        { name: 'Товар 6', price: 600, description: 'Описание товара 6' },
      ]
      
      const { error: productsError } = await supabase
        .from('products')
        .insert(products)
      
      if (productsError) {
        console.warn('Предупреждение при создании продуктов:', productsError.message)
      } else {
        console.log('✅ Тестовые продукты созданы')
      }
    } else {
      console.log(`✅ Продукты уже существуют (${existingProducts.length} шт.)`)
    }

    // 3. Если админ существует, обновляем его роль
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          approved: true
        })
        .eq('email', adminEmail)
      
      if (updateError) {
        console.warn('Предупреждение при обновлении роли админа:', updateError.message)
      } else {
        console.log('✅ Роль админа обновлена')
      }
    }

    console.log('')
    console.log('🎉 Инициализация завершена!')
    console.log('')
    console.log('🔐 Данные для входа:')
    console.log('Админ:')
    console.log(`  Email: ${adminEmail}`)
    console.log(`  Пароль: ${adminPassword}`)
    console.log('')
    console.log('💡 Инструкции:')
    if (!existingProfile) {
      console.log('1. Откройте приложение и зарегистрируйтесь с указанными данными админа')
      console.log('2. Запустите этот скрипт снова для назначения роли админа')
    }
    console.log('3. Для тестирования торгового представителя:')
    console.log('   - Зарегистрируйтесь через интерфейс с другим email')
    console.log('   - Войдите под админом и подтвердите регистрацию')
    console.log('   - Войдите под торговым представителем')

  } catch (error) {
    console.error('❌ Ошибка инициализации:', error)
    process.exit(1)
  }
}

// Запускаем инициализацию
seedDatabase()
