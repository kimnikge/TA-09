import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

console.log('🔍 Проверка переменных окружения...')
console.log('URL:', process.env.VITE_SUPABASE_URL)
console.log('KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Найден' : 'Не найден')

// Проверим, что в .env файле 
import fs from 'fs'
const envContent = fs.readFileSync('.env', 'utf8')
console.log('\n📁 Содержимое .env файла:')
console.log(envContent)
