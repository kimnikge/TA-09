import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODQ2MjEsImV4cCI6MjA0NzQ2MDYyMX0.3uVYpQsv_gIZEOJRcEBXVVJmNZFsRnrqMZ3pzKJsHBo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    // Полностью отключаем realtime для избежания WebSocket ошибок
    disabled: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

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
