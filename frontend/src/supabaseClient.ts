import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения с fallback значениями
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

// Отладочная информация
console.log('🔧 Настройка Supabase клиента...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Anon Key (первые 20 символов):', supabaseAnonKey?.substring(0, 20) + '...')
console.log('🔑 Anon Key length:', supabaseAnonKey?.length || 0)
console.log('🌍 Environment:', import.meta.env.MODE)
console.log('🔗 All env vars:', Object.keys(import.meta.env))

// Проверяем корректность ключа
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Отсутствуют переменные окружения Supabase')
  throw new Error('Supabase configuration missing')
}

if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ Некорректный URL Supabase')
  throw new Error('Invalid Supabase URL')
}

if (supabaseAnonKey.length < 100) {
  console.error('❌ Некорректный ключ Supabase (слишком короткий)')
  throw new Error('Invalid Supabase anon key')
}

// Создаем клиента
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    // Отключаем realtime для избежания WebSocket ошибок
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
})

// Тестируем подключение
supabase.from('profiles').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error)
    } else {
      console.log('✅ Supabase подключен успешно. Профилей в базе:', count)
    }
  })

console.log('✅ Supabase клиент создан успешно')

// Типы для базы данных
export interface Profile {
  id: string
  email: string
  name: string
  role: 'admin' | 'sales_rep'
  approved: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone: string
  address: string
  created_by: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  description: string
  created_at: string
}

export interface Order {
  id: string
  client_id: string
  sales_rep_id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  created_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
}
