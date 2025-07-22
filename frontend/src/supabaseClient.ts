import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения с fallback значениями
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

// Асинхронная функция проверки конфигурации (НЕ блокирует загрузку)
async function validateConfigAsync() {
  console.log('🔍 Асинхронная проверка конфигурации Supabase...')
  console.log('URL:', supabaseUrl)
  console.log('Key length:', supabaseAnonKey?.length)
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Отсутствуют переменные окружения Supabase')
    return false
  }

  if (!supabaseUrl.startsWith('https://')) {
    console.error('❌ Некорректный URL Supabase')
    return false
  }

  if (supabaseAnonKey.length < 100) {
    console.error('❌ Некорректный ключ Supabase (слишком короткий)')
    return false
  }
  
  console.log('✅ Конфигурация Supabase корректна')
  return true
}

// Создаем клиента БЕЗ блокирующей проверки
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

// Отладочная информация
console.log('🔧 Настройка Supabase клиента...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Anon Key (первые 20 символов):', supabaseAnonKey?.substring(0, 20) + '...')
console.log('🔑 Anon Key length:', supabaseAnonKey?.length || 0)
console.log('🌍 Environment:', import.meta.env.MODE)

// Асинхронная функция тестирования соединения (НЕ блокирует загрузку)
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔗 Асинхронное тестирование соединения с Supabase...')
    
    // Сначала проверяем конфигурацию
    const configValid = await validateConfigAsync()
    if (!configValid) {
      console.error('❌ Некорректная конфигурация Supabase')
      return false
    }
    
    // Тестируем соединение
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('⚠️ Ошибка соединения с Supabase:', error.message)
      return false
    }
    
    console.log('✅ Соединение с Supabase успешно')
    return true
  } catch (error) {
    console.error('❌ Критическая ошибка соединения:', error)
    return false
  }
}

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
