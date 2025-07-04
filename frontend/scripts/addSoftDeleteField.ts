import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Загружаем переменные окружения
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addSoftDeleteField() {
  try {
    console.log('🔄 Добавление поля deleted_at в таблицу clients...')
    
    // Проверяем текущую структуру
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Ошибка при проверке таблицы:', testError)
      return
    }
    
    if (testData && testData.length > 0) {
      const existingFields = Object.keys(testData[0])
      console.log('📊 Текущие поля таблицы clients:', existingFields)
      
      if (existingFields.includes('deleted_at')) {
        console.log('✅ Поле deleted_at уже существует!')
        return
      }
    }
    
    // Поскольку мы не можем выполнить DDL команды через Supabase client,
    // давайте создадим инструкцию для ручного выполнения
    console.log('📝 Необходимо выполнить следующие SQL команды в Supabase Dashboard:')
    console.log('')
    console.log('1. Добавить поле deleted_at:')
    console.log('ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;')
    console.log('')
    console.log('2. Создать индекс:')
    console.log('CREATE INDEX idx_clients_deleted_at ON clients(deleted_at);')
    console.log('')
    console.log('3. Обновить RLS политики для учета мягкого удаления')
    console.log('')
    console.log('🔧 Выполните эти команды в Supabase Dashboard > SQL Editor')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  }
}

addSoftDeleteField()
