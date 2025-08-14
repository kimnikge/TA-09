import React, { useState, useEffect, lazy, Suspense, memo } from 'react'
import { supabase, testConnection } from './supabaseClient'
import type { User } from '@supabase/supabase-js'
import { BarChart3, Package, Users, LogOut, Menu, X } from 'lucide-react'
import { adaptForMobile, isAndroid } from './utils/mobileHelpers'
import './App.css'

// Lazy loading компонентов для уменьшения первоначального бандла
const AdminAccess = lazy(() => import('./admin/AdminAccess').then(module => ({ default: module.AdminAccess })))
const OrderPage = lazy(() => import('./pages/OrderPage'))
const ClientsPage = lazy(() => import('./pages/ClientsPage'))
const ThreeStepOrderWrapper = lazy(() => import('./components/ThreeStepOrderWrapper'))
// demo page удалена

// Улучшенный компонент загрузки
const LoadingSpinner = memo(({ message = 'Загрузка...' }: { message?: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">{message}</span>
  </div>
))

// Компонент мгновенного скелетона для быстрой первой отрисовки
const InstantSkeleton = memo(() => {
  // Для Android показываем упрощенный скелетон
  if (isAndroid()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Для остальных устройств - полный скелетон
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мгновенная навигационная панель */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-200 rounded animate-pulse"></div>
              <div className="ml-3 h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Мгновенный контент */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
})

function App() {
  // По умолчанию показываем 3-шаговый процесс как основной интерфейс
  const [currentPage, setCurrentPage] = useState<'threestep' | 'products' | 'clients' | 'cart' | 'admin'>('threestep')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'sales_rep'>('sales_rep')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Состояния для формы авторизации
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Мобильная инициализация
  useEffect(() => {
    adaptForMobile()
    
    if (!isAndroid()) {
      testConnection()
    }
    
    const hideLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        loadingScreen.style.display = 'none'
      }
    }
    
    const timer = setTimeout(hideLoadingScreen, isAndroid() ? 100 : 1500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isAndroid()) {
      setLoading(false)
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
        if (user) {
          supabase.from('profiles').select('role, approved').eq('id', user.id).single()
            .then(({ data }) => {
              const finalRole = data?.role === 'admin' ? 'admin' : 'sales_rep';
              setUserRole(finalRole)
            })
        }
      }).catch(() => {
        setUser(null)
        setUserRole('sales_rep')
      })
      return
    }

    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, isAndroid() ? 50 : 500)
    
    const getUserAndRole = async (currentUser: User | null) => {
      if (currentUser) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role, approved')
            .eq('id', currentUser.id)
            .single()

          if (error) {
            console.error('Ошибка получения роли:', error.message)
            setUserRole('sales_rep')
            return
          }

          const finalRole = data?.role === 'admin' ? 'admin' : 'sales_rep'
          setUserRole(finalRole)
        } catch (error) {
          console.error('Ошибка getUserAndRole:', error)
          setUserRole('sales_rep')
        }
      } else {
        setUserRole('sales_rep')
      }
    }

    const getUser = () => {
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.error('Ошибка получения сессии:', error.message)
            setUser(null)
            setLoading(false)
            return
          }

          const currentUser = session?.user ?? null
          setUser(currentUser)
          
          if (currentUser) {
            getUserAndRole(currentUser).catch(() => {
              setUserRole('sales_rep')
            })
          }
          
          setLoading(false)
        })
        .catch(() => {
          setUser(null)
          setLoading(false)
        })
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        getUserAndRole(currentUser).catch(() => {
          setUserRole('sales_rep')
        })
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const currentUser = {
    id: user?.id || '',
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Пользователь',
    email: user?.email || ''
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserRole('sales_rep')
      setCurrentPage('threestep')
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  if (loading) {
    return <InstantSkeleton />
  }

  // Демо-режим отключён
  const isDemo = false

  if (!user && !isDemo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {authMode === 'signin' ? 'Вход в систему' : 'Регистрация'}
            </h2>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={async (e) => {
            e.preventDefault()
            setAuthLoading(true)
            setAuthError('')
            
            try {
              if (authMode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                  email,
                  password
                })
                if (error) throw error
              } else {
                const { error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      full_name: fullName
                    }
                  }
                })
                if (error) throw error
              }
            } catch (error: unknown) {
              setAuthError(error instanceof Error ? error.message : 'Произошла ошибка')
            } finally {
              setAuthLoading(false)
            }
          }}>
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {authError}
              </div>
            )}
            
            <div className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="fullName" className="sr-only">Полное имя</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Полное имя"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email адрес"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">Пароль</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Пароль"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {authLoading ? 'Загрузка...' : (authMode === 'signin' ? 'Войти' : 'Зарегистрироваться')}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-600 hover:text-blue-500"
              >
                {authMode === 'signin' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                Система управления заказами
              </h1>
            </div>
            
            {/* Бургер-меню справа */}
            <div className="flex items-center space-x-4">
              <span className="hidden lg:block text-sm text-gray-700 truncate max-w-32">
                {currentUser.name}
              </span>
              
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                {/* Выпадающее меню */}
                {mobileMenuOpen && (
                  <>
                    {/* Оверлей для закрытия меню */}
                    <div 
                      className="fixed inset-0 z-40 sm:hidden" 
                      onClick={() => setMobileMenuOpen(false)}
                    ></div>
                    
                    {/* Меню */}
                    <div className="absolute right-0 mt-2 w-screen sm:w-56 max-w-xs bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 sm:max-w-none">
                      <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentPage('products');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                          currentPage === 'products' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <Package className="w-4 h-4 mr-3" />
                        Товары
                      </button>
                      
                      <button
                        onClick={() => {
                          setCurrentPage('clients');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                          currentPage === 'clients' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <Users className="w-4 h-4 mr-3" />
                        Клиенты
                      </button>
                      
                      <button
                        onClick={() => {
                          setCurrentPage('cart');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                          currentPage === 'cart' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <Package className="w-4 h-4 mr-3" />
                        Корзина
                      </button>
                      
                      {userRole === 'admin' && (
                        <button
                          onClick={() => {
                            setCurrentPage('admin');
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                            currentPage === 'admin' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4 mr-3" />
                          Админка
                        </button>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Выйти
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Основное содержимое */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingSpinner />}>
          {/* demo removed */}
          {/* По умолчанию показываем 3-шаговый процесс */}
          {!isDemo && currentPage === 'threestep' && (
            <ThreeStepOrderWrapper currentUser={currentUser} />
          )}

          {/* Отдельные страницы из бургер-меню */}
          {!isDemo && currentPage === 'products' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Каталог товаров</h2>
              <OrderPage currentUser={currentUser} />
            </div>
          )}
          
          {!isDemo && currentPage === 'clients' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Управление клиентами</h2>
              <ClientsPage currentUser={currentUser} />
            </div>
          )}

          {!isDemo && currentPage === 'cart' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Корзина заказов</h2>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-gray-600 mb-4">
                  Здесь будет отображаться сводка текущих заказов в корзине
                </p>
                <button 
                  onClick={() => setCurrentPage('threestep')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                  Перейти к созданию заказа
                </button>
              </div>
            </div>
          )}
          
          {!isDemo && currentPage === 'admin' && userRole === 'admin' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Административная панель</h2>
              <AdminAccess />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}

export default App
