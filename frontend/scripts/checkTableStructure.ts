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

async function checkTableStructure() {
  console.log('🔍 Проверяем структуру таблиц...')
  
  try {
    // Попробуем получить структуру таблицы profiles через select *
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Ошибка profiles:', profilesError.message)
    } else {
      console.log('✅ Таблица profiles доступна')
      if (profiles && profiles.length > 0) {
        console.log('📊 Пример записи profiles:')
        console.log(profiles[0])
        console.log('🔑 Колонки:', Object.keys(profiles[0]))
      } else {
        console.log('📊 Таблица profiles пустая')
      }
    }
    
    // Попробуем вставить простую запись
    console.log('🧪 Тестируем вставку в profiles...')
    const testId = 'test-user-id-123'
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        name: 'Тестовый пользователь',
        role: 'sales_rep',
        approved: false
      })
    
    if (insertError) {
      console.log('❌ Ошибка вставки:', insertError.message)
      console.log('📝 Детали ошибки:', insertError)
    } else {
      console.log('✅ Тестовая вставка успешна')
      
      // Удаляем тестовую запись
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testId)
      
      console.log('🗑️ Тестовая запись удалена')
    }
    
    // Проверим таблицы на существование
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
          console.log(`✅ Таблица ${table}: доступна`)
        }
      } catch {
        console.log(`❌ Таблица ${table}: недоступна`)
      }
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error)
  }
}

checkTableStructure()
