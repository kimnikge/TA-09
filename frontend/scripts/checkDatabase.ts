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

const supabase = createClient(
  env.VITE_SUPABASE_URL || 'http://localhost:54321',
  env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
)

async function checkDatabase() {
  console.log('🔍 Проверяем подключение к Supabase...')
  
  try {
    // Проверяем подключение
    await supabase.auth.getUser()
    console.log('✅ Подключение к Supabase установлено')
    
    // Проверяем таблицы
    const tables = ['profiles', 'clients', 'products', 'orders', 'order_items']
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Таблица ${table}: ${error.message}`)
        } else {
          console.log(`✅ Таблица ${table}: существует`)
        }
      } catch {
        console.log(`❌ Таблица ${table}: ошибка проверки`)
      }
    }
    
    // Проверяем данные в profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.log('❌ Ошибка при получении профилей:', profilesError.message)
    } else {
      console.log(`📊 Количество профилей в БД: ${profiles?.length || 0}`)
      if (profiles && profiles.length > 0) {
        console.log('👥 Найденные профили:')
        profiles.forEach(profile => {
          console.log(`  - ${profile.email} (${profile.role}, approved: ${profile.approved})`)
        })
      }
    }
    
    // Проверяем продукты
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
    
    if (productsError) {
      console.log('❌ Ошибка при получении продуктов:', productsError.message)
    } else {
      console.log(`📦 Количество продуктов в БД: ${products?.length || 0}`)
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error)
  }
}

checkDatabase()
