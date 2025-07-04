import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Загружаем переменные окружения
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applySoftDeleteMigration() {
  try {
    console.log('🔄 Применение миграции мягкого удаления...')
    
    // Читаем SQL файл
    const sqlContent = readFileSync(join(process.cwd(), '..', 'ADD_SOFT_DELETE_CLIENTS.sql'), 'utf8')
    
    // Разбиваем на отдельные команды
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'))
    
    console.log(`📝 Найдено команд для выполнения: ${commands.length}`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim()
      if (!command) continue
      
      console.log(`⏳ Выполнение команды ${i + 1}/${commands.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error) {
          console.log(`⚠️  Ошибка в команде ${i + 1}: ${error.message}`)
        } else {
          console.log(`✅ Команда ${i + 1} выполнена успешно`)
        }
      } catch (err) {
        console.log(`⚠️  Ошибка в команде ${i + 1}: ${err.message}`)
      }
    }
    
    console.log('🎉 Миграция завершена!')
    
    // Проверяем, что поле добавлено
    const { data: columns, error: columnsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)
    
    if (columnsError) {
      console.error('❌ Ошибка при проверке структуры таблицы:', columnsError)
      return
    }
    
    if (columns && columns.length > 0) {
      const columnNames = Object.keys(columns[0])
      console.log('📊 Текущие поля таблицы clients:', columnNames)
      
      if (columnNames.includes('deleted_at')) {
        console.log('✅ Поле deleted_at успешно добавлено!')
      } else {
        console.log('❌ Поле deleted_at не найдено')
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:', error)
  }
}

applySoftDeleteMigration()
