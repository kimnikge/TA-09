import React, { useState, useEffect, lazy, Suspense, memo } from 'react'
import { supabase, testConnection } from './supabaseClient'
import type { User } from '@supabase/supabase-js'
import { BarChart3, Package, Users, LogOut, Menu, X } from 'lucide-react'
import { adaptForMobile, getDeviceInfo, isAndroid } from './utils/mobileHelpers'
import './App.css'

// Lazy loading компонентов для уменьшения первоначального бандла
const AdminAccess = lazy(() => import('./admin/AdminAccess').then(module => ({ default: module.AdminAccess })))
const OrderPage = lazy(() => import('./pages/OrderPage'))
const ClientsPage = lazy(() => import('./pages/ClientsPage'))

// Улучшенный компонент загрузки
const LoadingSpinner = memo(({ message = 'Загрузка...' }: { message?: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">{message}</span>
  </div>
))

// Компонент мгновенного скелетона для быстрой первой отрисовки
const InstantSkeleton = memo(() => {
  // console.log убран для совместимости с Android
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
  // console.log убран для совместимости с Android
  const [currentPage, setCurrentPage] = useState<'order' | 'clients' | 'admin'>('order')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'sales_rep'>('sales_rep')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // console.log убран для совместимости с Android
  
  // Состояния для формы авторизации
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Мобильная инициализация
  useEffect(() => {
    // Применяем мобильную адаптацию
    adaptForMobile()
    
    // Логируем информацию об устройстве (только в development)
    if (process.env.NODE_ENV === 'development') {
      const deviceInfo = getDeviceInfo()
      console.log('📱 Информация об устройстве:', deviceInfo)
    }
    
    // Тестируем подключение к Supabase (не блокирует UI)
    testConnection()
    
    // Скрываем загрузочный экран
    const hideLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        loadingScreen.style.display = 'none'
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Загрузочный экран скрыт')
        }
      }
    }
    
    // Для Android значительно уменьшаем время ожидания
    const timer = setTimeout(hideLoadingScreen, isAndroid() ? 300 : 1500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Инициализация аутентификации...')
    }
    
    // Таймер безопасности - для Android значительно уменьшаем для быстрой загрузки
    const safetyTimer = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏰ Таймер безопасности: принудительно убираем loading (быстрая загрузка)')
      }
      setLoading(false)
    }, isAndroid() ? 200 : 500) // Android: 200мс, остальные: 500мс
    
    // Получить текущего пользователя и его роль
    const getUserAndRole = async (currentUser: User | null) => {
      if (currentUser) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Получение роли пользователя:', currentUser.email)
          }
          
          // Проверить роль пользователя в таблице profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single()
          
          if (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Ошибка получения профиля пользователя:', error)
            }
            setUserRole('sales_rep') // Роль по умолчанию
            return
          }
          
          if (profile?.role === 'admin') {
            setUserRole('admin')
            if (process.env.NODE_ENV === 'development') {
              console.log('👑 Пользователь - администратор')
            }
          } else {
            setUserRole('sales_rep')
            if (process.env.NODE_ENV === 'development') {
              console.log('👨‍💼 Пользователь - торговый представитель')
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('❌ Ошибка при получении роли пользователя:', error)
          }
          setUserRole('sales_rep')
        }
      } else {
        setUserRole('sales_rep')
      }
    }

    // Получить текущего пользователя БЕЗ блокирующего await
    const getUser = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Получение текущего пользователя...')
      }
      
      // Немедленно убираем loading для быстрого рендеринга
      setLoading(false)
      clearTimeout(safetyTimer)
      
      // Асинхронно получаем пользователя в фоне
      supabase.auth.getUser()
        .then(({ data: { user }, error }) => {
          if (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Ошибка аутентификации:', error.message)
            }
            setUser(null)
            setUserRole('sales_rep')
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Пользователь получен:', user?.email || 'Нет пользователя')
            }
            setUser(user)
            // Асинхронно получаем роль
            if (user) {
              getUserAndRole(user)
            }
          }
        })
        .catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('❌ Ошибка при получении пользователя:', error)
          }
          setUser(null)
          setUserRole('sales_rep')
        })
    }

    // Слушать изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Auth state change:', event, session?.user?.email)
      }
      const currentUser = session?.user ?? null
      
      // Обрабатываем событие выхода из системы
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole('sales_rep')
        return
      }
      
      // Обрабатываем ошибки токена
      if (event === 'TOKEN_REFRESHED' && !session) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Ошибка обновления токена, выходим из системы')
        }
        await supabase.auth.signOut()
        setUser(null)
        setUserRole('sales_rep')
        return
      }
      
      setUser(currentUser)
      await getUserAndRole(currentUser)
    })

    // Инициализируем пользователя
    getUser()

    // Очищаем таймер и подписку при размонтировании
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
    await supabase.auth.signOut()
    setCurrentPage('order')
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      // Очищаем возможные некорректные токены перед входом
      const { data: currentSession } = await supabase.auth.getSession()
      if (currentSession.session && authMode === 'signin') {
        // Если есть сессия, но пользователь пытается войти снова, очищаем старую сессию
        await supabase.auth.signOut()
      }

      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        // Регистрация нового пользователя
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
        
        if (error) throw error
        
        // Если пользователь успешно создан, пытаемся создать профиль
        if (data.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Пользователь создан, создаем профиль...', data.user.id)
          }
          
          // Небольшая задержка для синхронизации с auth.users
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Пытаемся создать профиль несколько раз
          let profileCreated = false
          let attempts = 0
          const maxAttempts = 3
          
          while (!profileCreated && attempts < maxAttempts) {
            attempts++
            if (process.env.NODE_ENV === 'development') {
              console.log(`Попытка создания профиля ${attempts}/${maxAttempts}`)
            }
            
            try {
              const { data: newProfile, error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: email,
                  name: fullName,
                  role: 'sales_rep',
                  approved: false
                })
                .select()
                .single()
              
              if (profileError) {
                if (process.env.NODE_ENV === 'development') {
                  console.error(`Ошибка создания профиля (попытка ${attempts}):`, profileError)
                }
                
                if (attempts === maxAttempts) {
                  // Последняя попытка неудачна
                  setAuthError(`Пользователь зарегистрирован, но не удалось создать профиль. Код ошибки: ${profileError.code}. Попробуйте войти в систему позже или обратитесь к администратору.`)
                  break
                } else {
                  // Ждем перед следующей попыткой
                  await new Promise(resolve => setTimeout(resolve, 2000))
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Профиль создан успешно:', newProfile)
                }
                profileCreated = true
                // Показываем сообщение об успешной регистрации
                setAuthError('')
              }
            } catch (err) {
              if (process.env.NODE_ENV === 'development') {
                console.error(`Неожиданная ошибка при создании профиля (попытка ${attempts}):`, err)
              }
              if (attempts === maxAttempts) {
                setAuthError('Произошла неожиданная ошибка при создании профиля. Обратитесь к администратору.')
              }
            }
          }
        }
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setAuthLoading(false)
    }
  }

  // Показываем InstantSkeleton только в самом начале для мгновенной отрисовки
  if (loading) {
    return <InstantSkeleton />
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
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Полное имя
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Иван Иванов"
                  required
                  disabled={authLoading}
                  minLength={2}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                setEmail('')
                setPassword('')
                setFullName('')
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
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                Система управления заказами
              </h1>
            </div>
            
            {/* Десктопная навигация */}
            <div className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage('order')}
                className={`px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'order'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1 lg:mr-2" />
                Заказы
              </button>
              
              <button
                onClick={() => setCurrentPage('clients')}
                className={`px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'clients'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1 lg:mr-2" />
                Клиенты
              </button>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                    currentPage === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1 lg:mr-2" />
                  Админ-панель
                </button>
              )}
            </div>
            
            {/* Планшетная навигация (средние экраны) */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              <button
                onClick={() => setCurrentPage('order')}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 'order'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title="Заказы"
              >
                <Package className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentPage('clients')}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 'clients'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title="Клиенты"
              >
                <Users className="w-5 h-5" />
              </button>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Админ-панель"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Мобильная навигация */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            
            {/* Пользователь и выход */}
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-xs lg:text-sm text-gray-700 truncate max-w-24 lg:max-w-32">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-xs lg:text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                Выйти
              </button>
            </div>
          </div>
          
          {/* Мобильное меню */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="pt-2 pb-3 space-y-1 px-4">
                <button
                  onClick={() => {
                    setCurrentPage('order');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-md text-base font-medium transition-colors flex items-center ${
                    currentPage === 'order'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5 mr-3 flex-shrink-0" />
                  Заказы
                </button>
                
                <button
                  onClick={() => {
                    setCurrentPage('clients');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-md text-base font-medium transition-colors flex items-center ${
                    currentPage === 'clients'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                  Клиенты
                </button>
                
                {userRole === 'admin' && (
                  <button
                    onClick={() => {
                      setCurrentPage('admin');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-md text-base font-medium transition-colors flex items-center ${
                      currentPage === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5 mr-3 flex-shrink-0" />
                    Админ-панель
                  </button>
                )}
                
                {/* Мобильная информация о пользователе */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-3 py-2">
                    <p className="text-base font-medium text-gray-900 truncate">{currentUser.name}</p>
                    <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-3 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Основное содержимое - строгий условный рендеринг */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingSpinner />}>
          {currentPage === 'order' && (
            <OrderPage currentUser={currentUser} userRole={userRole} />
          )}
          
          {currentPage === 'clients' && (
            <ClientsPage currentUser={currentUser} userRole={userRole} />
          )}
          
          {currentPage === 'admin' && (
            <AdminAccess />
          )}
        </Suspense>
      </main>
    </div>
  )
}

export default App
