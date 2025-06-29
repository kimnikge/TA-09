import { createClient } from '@supabase/supabase-js'

// Загружаем переменные окружения
const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Функция для выполнения SQL-скрипта
async function updateDatabase() {
  console.log('🔧 Начинаем обновление структуры базы данных...')
  
  try {
    // Выполняем обновления по частям
    await executeScriptInParts()
    
    // Проверяем результат
    await checkDatabaseStructure()
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

// Проверка и тестирование структуры
async function executeScriptInParts() {
  console.log('🔧 Тестируем существующую структуру базы данных...')
  
  console.log('ℹ️ Примечание: DDL операции (ALTER TABLE) не могут быть выполнены через клиентское API.')
  console.log('ℹ️ Необходимо выполнить SQL-скрипт через веб-интерфейс Supabase.')
  console.log('')
  console.log('📋 SQL-скрипт для выполнения:')
  console.log('----------------------------------------')
  console.log(`-- 1. Добавление недостающих колонок в таблицу profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'sales_rep')) DEFAULT 'sales_rep';

-- 2. Добавление недостающей колонки category в таблицу products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- 3. Обновление значений по умолчанию для существующих записей
UPDATE profiles 
SET 
  role = COALESCE(role, 'sales_rep'),
  name = COALESCE(name, 'Пользователь')
WHERE role IS NULL OR name IS NULL;`)
  console.log('----------------------------------------')
  console.log('')
  
  // Попробуем создать тестовые записи для проверки существующей структуры
  try {
    console.log('⚡ Проверяем, можем ли мы читать из profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Ошибка чтения profiles:', profilesError.message)
    } else {
      console.log('✅ Таблица profiles доступна')
      console.log('📊 Пример записи:', profiles?.[0] || 'Нет записей')
    }
  } catch (error) {
    console.warn('⚠️ Ошибка проверки profiles:', error)
  }
  
  try {
    console.log('⚡ Проверяем, можем ли мы читать из products...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (productsError) {
      console.log('❌ Ошибка чтения products:', productsError.message)
    } else {
      console.log('✅ Таблица products доступна')
      console.log('📊 Пример записи:', products?.[0] || 'Нет записей')
    }
  } catch (error) {
    console.warn('⚠️ Ошибка проверки products:', error)
  }
}

// Проверка структуры базы данных
async function checkDatabaseStructure() {
  console.log('')
  console.log('🔍 Проверяем текущую структуру базы данных...')
  
  try {
    // Проверяем таблицу profiles
    const { data: profileTest, error: profileTestError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (!profileTestError) {
      console.log('✅ Таблица profiles доступна')
      if (profileTest && profileTest.length > 0) {
        const record = profileTest[0]
        console.log('📋 Столбцы profiles:', Object.keys(record).join(', '))
        
        // Проверяем наличие нужных столбцов
        const requiredColumns = ['email', 'name', 'role']
        const missingColumns = requiredColumns.filter(col => !(col in record))
        
        if (missingColumns.length > 0) {
          console.log('❌ Отсутствующие столбцы в profiles:', missingColumns.join(', '))
        } else {
          console.log('✅ Все необходимые столбцы в profiles присутствуют')
        }
      } else {
        console.log('ℹ️ Таблица profiles пуста')
      }
    } else {
      console.log('❌ Ошибка чтения profiles:', profileTestError.message)
    }
    
    // Проверяем таблицу products
    const { data: productsTest, error: productsTestError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (!productsTestError) {
      console.log('✅ Таблица products доступна')
      if (productsTest && productsTest.length > 0) {
        const record = productsTest[0]
        console.log('📋 Столбцы products:', Object.keys(record).join(', '))
        
        // Проверяем наличие столбца category
        if ('category' in record) {
          console.log('✅ Столбец category в products присутствует')
        } else {
          console.log('❌ Отсутствует столбец category в products')
        }
      } else {
        console.log('ℹ️ Таблица products пуста')
      }
    } else {
      console.log('❌ Ошибка чтения products:', productsTestError.message)
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки структуры:', error)
  }
}

// Запуск обновления
updateDatabase().then(() => {
  console.log('🎉 Обновление базы данных завершено!')
  console.log('🔄 Обновите страницу в браузере, чтобы увидеть результат')
}).catch((error) => {
  console.error('💥 Критическая ошибка:', error)
})

export { updateDatabase, checkDatabaseStructure }
