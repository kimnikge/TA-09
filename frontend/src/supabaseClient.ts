import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

// Создаем клиент с полностью отключенным realtime
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Добавляем обработчики для улучшенной стабильности
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key)
        } catch (error) {
          console.warn('Ошибка localStorage getItem:', error)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.warn('Ошибка localStorage setItem:', error)
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn('Ошибка localStorage removeItem:', error)
        }
      }
    }
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

// Принудительно отключаем все realtime соединения
try {
  if (supabase.realtime) {
    supabase.realtime.disconnect()
    // Удаляем обработчики событий
    supabase.realtime.removeAllChannels()
  }
} catch (error) {
  console.warn('⚠️ Ошибка при отключении realtime:', error)
}

// Блокируем создание новых каналов
supabase.channel = () => {
  console.warn('🚫 Попытка создания realtime канала заблокирована')
  return {
    on: () => ({ unsubscribe: () => {} }),
    subscribe: () => 'SUBSCRIBED',
    unsubscribe: () => 'UNSUBSCRIBED',
    send: () => {},
    track: () => {},
    untrack: () => {},
    presence: { state: {} },
    socket: null
  } as unknown as ReturnType<typeof supabase.channel>
}

// Функция для очистки некорректных токенов
export const clearInvalidTokens = async () => {
  try {
    const { error } = await supabase.auth.getSession()
    
    if (error && error.message.includes('refresh_token_not_found')) {
      // Очищаем localStorage от некорректных токенов
      localStorage.clear()
      await supabase.auth.signOut()
      console.log('🧹 Очищены некорректные refresh токены')
      return true
    }
    
    if (error && error.message.includes('Invalid Refresh Token')) {
      // Очищаем localStorage от некорректных токенов
      localStorage.clear()
      await supabase.auth.signOut()
      console.log('🧹 Очищены недействительные токены')
      return true
    }
    
    return false
  } catch (error) {
    console.warn('⚠️ Ошибка при очистке токенов:', error)
    localStorage.clear()
    await supabase.auth.signOut()
    return true
  }
}

// Функция для безопасного получения сессии
export const getSessionSafely = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('⚠️ Ошибка сессии:', error)
      await clearInvalidTokens()
      return null
    }
    
    return session
  } catch (error) {
    console.error('❌ Критическая ошибка сессии:', error)
    await clearInvalidTokens()
    return null
  }
}

// Функция для принудительного обновления токена
export const refreshTokenSafely = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.warn('⚠️ Ошибка обновления токена:', error)
      await clearInvalidTokens()
      return null
    }
    
    return data.session
  } catch (error) {
    console.error('❌ Критическая ошибка обновления токена:', error)
    await clearInvalidTokens()
    return null
  }
}

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
