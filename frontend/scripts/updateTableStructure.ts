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

async function updateTableStructure() {
  console.log('🔧 Обновляем структуру таблицы profiles...')
  
  try {
    // Попробуем выполнить SQL для добавления недостающих колонок
    // Примечание: обычно это требует service role key, но попробуем через RPC
    
    console.log('⚠️  Для обновления структуры таблицы нужно выполнить SQL команды в Supabase Dashboard')
    console.log('')
    console.log('📋 SQL команды для выполнения в SQL Editor:')
    console.log('')
    
    const sqlCommands = `
-- Добавление недостающих колонок в таблицу profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'sales_rep')) DEFAULT 'sales_rep',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Обновление значений по умолчанию для существующих записей
UPDATE profiles 
SET 
  role = 'sales_rep',
  name = 'Пользователь',
  updated_at = NOW()
WHERE role IS NULL OR name IS NULL;

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Проверка обновленной структуры
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
`
    
    console.log(sqlCommands)
    console.log('')
    console.log('📝 Инструкции:')
    console.log('1. Откройте Supabase Dashboard')
    console.log('2. Перейдите в SQL Editor')
    console.log('3. Вставьте и выполните SQL команды выше')
    console.log('4. После выполнения запустите этот скрипт снова для проверки')
    console.log('')
    
    // Проверяем, может быть колонки уже добавлены
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, email, name, role, approved, created_at, updated_at')
      .limit(1)
    
    if (!testError) {
      console.log('✅ Похоже, что структура таблицы уже актуальна!')
      console.log('📊 Колонки в таблице:', Object.keys(testData?.[0] || {}))
      return true
    } else {
      console.log('❌ Структура таблицы требует обновления')
      console.log('🔍 Ошибка:', testError.message)
      return false
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
    return false
  }
}

updateTableStructure()
