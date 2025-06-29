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
  
  // Состояния для формы авторизации
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Получить текущего пользователя и его роль
    const getUserAndRole = async (currentUser: User | null) => {
      if (currentUser) {
        console.log('🔍 Проверяем роль пользователя:', currentUser.email)
        
        // Проверить роль пользователя в таблице profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()
        
        console.log('📊 Данные профиля:', profile)
        console.log('❌ Ошибка получения профиля:', error)
        
        if (profile?.role === 'admin') {
          console.log('✅ Пользователь - админ')
          setUserRole('admin')
        } else {
          console.log('👤 Пользователь - торговый агент')
          setUserRole('sales_rep')
        }
      } else {
        setUserRole('sales_rep')
      }
    }

    // Получить текущего пользователя
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await getUserAndRole(user)
      setLoading(false)
    }

    getUser()

    // Слушать изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      await getUserAndRole(currentUser)
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setAuthLoading(false)
    }
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
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <Package className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Система управления заказами
            </h1>
            <p className="text-gray-600">
              {authMode === 'signin' ? 'Войдите в систему' : 'Создайте аккаунт'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                required
                disabled={authLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите пароль"
                required
                disabled={authLoading}
                minLength={6}
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {authMode === 'signin' ? 'Вход...' : 'Регистрация...'}
                </div>
              ) : (
                authMode === 'signin' ? 'Войти' : 'Зарегистрироваться'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                setAuthError('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {authMode === 'signin' 
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'
              }
            </button>
          </div>
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
              <div className="text-sm text-gray-700">
                <div>{currentUser.name}</div>
                <div className="text-xs text-gray-500">
                  Роль: {userRole === 'admin' ? '👑 Админ' : '👤 Торг.агент'} | ID: {user?.id?.slice(0, 8)}...
                </div>
              </div>
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
