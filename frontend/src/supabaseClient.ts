import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
