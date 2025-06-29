import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js'
import { BarChart3, Package, Users, LogOut } from 'lucide-react'
import './App.css'

// Импорты компонентов
import AdminAccess from './admin/AdminAccess'
import OrderPage from './pages/OrderPage'
import ClientsPage from './pages/ClientsPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'order' | 'clients' | 'admin'>('order')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'sales_rep'>('sales_rep')

  useEffect(() => {
    // Получить текущего пользователя
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Проверить роль пользователя в таблице profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'admin') {
          setUserRole('admin')
        }
      }
      
      setLoading(false)
    }

    getUser()

    // Слушать изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserRole('sales_rep')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const currentUser = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Пользователь',
    email: user?.email || ''
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentPage('order')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Система управления заказами
          </h1>
          <p className="text-gray-600 mb-6">
            Войдите в систему с помощью вашего email и пароля
          </p>
          <button
            onClick={() => window.location.href = `${window.location.origin}/auth`}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Перейти к авторизации
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Система управления заказами
              </h1>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage('order')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'order'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Заказы
              </button>
              
              <button
                onClick={() => setCurrentPage('clients')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'clients'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Клиенты
              </button>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Админ-панель
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Основное содержимое - строгий условный рендеринг */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === 'order' && (
          <OrderPage currentUser={currentUser} userRole={userRole} />
        )}
        
        {currentPage === 'clients' && (
          <ClientsPage />
        )}
        
        {currentPage === 'admin' && (
          <AdminAccess />
        )}
      </main>
    </div>
  )
}

export default App
