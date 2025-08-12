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
  // console.log убран для совместимости с Android
  const [currentPage, setCurrentPage] = useState<'order' | 'clients' | 'admin'>('order')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'sales_rep'>('sales_rep')
  const [userApproved, setUserApproved] = useState<boolean>(true) // Статус одобрения пользователя
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
    
    // Тестируем подключения к Supabase (только НЕ для Android - может зависать)
    if (!isAndroid()) {
      testConnection()
    }
    
    // Скрываем загрузочный экран
    const hideLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        loadingScreen.style.display = 'none'
      }
    }
    
    // Для Android значительно уменьшаем время ожидания
    const timer = setTimeout(hideLoadingScreen, isAndroid() ? 100 : 1500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // ЭКСТРЕМАЛЬНАЯ ОПТИМИЗАЦИЯ ДЛЯ ANDROID: немедленный показ UI
    if (isAndroid()) {
      setLoading(false)
      console.log('📱 App.tsx: Android режим - быстрая загрузка');
      
      // Сразу пытаемся получить пользователя без задержек
      supabase.auth.getUser().then(({ data: { user } }) => {
        console.log('👤 App.tsx: Android - пользователь получен:', user?.email);
        setUser(user)
        if (user) {
          // Получаем роль И статус одобрения в фоне без блокировки
          supabase.from('profiles').select('role, approved').eq('id', user.id).single()
            .then(({ data, error }) => {
              console.log('📋 App.tsx: Android - профиль:', data);
              console.log('❌ App.tsx: Android - ошибка:', error);
              
              const finalRole = data?.role === 'admin' ? 'admin' : 'sales_rep';
              console.log(`🎯 App.tsx: Android - устанавливаем роль: ${finalRole}`);
              
              setUserRole(finalRole)
              setUserApproved(data?.approved ?? true) // По умолчанию одобрен для старых записей
            })
        }
      }).catch(() => {
        console.log('❌ App.tsx: Android - ошибка получения пользователя');
        setUser(null)
        setUserRole('sales_rep')
        setUserApproved(true)
      })
      return
    }

    // Для остальных устройств - обычная логика
    // Таймер безопасности - для Android ЭКСТРЕМАЛЬНО быстрый
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, isAndroid() ? 50 : 500) // Android: 50мс (!), остальные: 500мс
    
    // Получить текущего пользователя и его роль
    const getUserAndRole = async (currentUser: User | null) => {
      if (currentUser) {
        try {
          console.log('🔍 App.tsx: Получаем роль для пользователя:', currentUser.email);
          
          // Проверить роль пользователя И статус одобрения в таблице profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, approved')
            .eq('id', currentUser.id)
            .single()
          
          console.log('📋 App.tsx: Профиль из БД:', profile);
          console.log('❌ App.tsx: Ошибка профиля:', error);
          
          if (error) {
            console.log('⚠️ App.tsx: Ошибка получения профиля, устанавливаем sales_rep');
            setUserRole('sales_rep') // Роль по умолчанию
            setUserApproved(true) // По умолчанию одобрен для совместимости
            return
          }
          
          // Устанавливаем роль
          const finalRole = profile?.role === 'admin' ? 'admin' : 'sales_rep';
          console.log(`🎯 App.tsx: Устанавливаем роль: ${finalRole} (из БД: ${profile?.role})`);
          
          setUserRole(finalRole);
          
          // Устанавливаем статус одобрения
          const approved = profile?.approved ?? true // По умолчанию одобрен для старых записей
          setUserApproved(approved)
        } catch (err) {
          console.error('❌ App.tsx: Исключение при получении роли:', err);
          setUserRole('sales_rep')
        }
      } else {
        console.log('❌ App.tsx: Нет пользователя, устанавливаем sales_rep');
        setUserRole('sales_rep')
      }
    }

    // Получить текущего пользователя БЕЗ блокирующего await
    const getUser = () => {
      // ДЛЯ ANDROID: Немедленно убираем loading для мгновенного показа UI
      if (isAndroid()) {
        setLoading(false)
        clearTimeout(safetyTimer)
      }
      
      // Асинхронно получаем пользователя в фоне (НЕ блокирует UI)
      supabase.auth.getUser()
        .then(({ data: { user }, error }) => {
          // Для не-Android устройств убираем loading после получения пользователя
          if (!isAndroid()) {
            setLoading(false)
            clearTimeout(safetyTimer)
          }
          
          if (error) {
            setUser(null)
            setUserRole('sales_rep')
          } else {
            setUser(user)
            // Асинхронно получаем роль (НЕ блокирует UI)
            if (user) {
              getUserAndRole(user).catch(() => setUserRole('sales_rep'))
            }
          }
        })
        .catch(() => {
          // Убираем loading даже при ошибке
          setLoading(false)
          clearTimeout(safetyTimer)
          setUser(null)
          setUserRole('sales_rep')
        })
    }

    // Слушать изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      
      // Обрабатываем событие выхода из системы
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole('sales_rep')
        setUserApproved(true) // Сброс статуса одобрения
        return
      }
      
      // Обрабатываем ошибки токена
      if (event === 'TOKEN_REFRESHED' && !session) {
        await supabase.auth.signOut()
        setUser(null)
        setUserRole('sales_rep')
        setUserApproved(true) // Сброс статуса одобрения
        return
      }
      
      setUser(currentUser)
      // НЕ блокируем поток - запускаем в фоне
      if (currentUser) {
        getUserAndRole(currentUser).catch(() => {
          // Если ошибка получения роли - ставим по умолчанию
          setUserRole('sales_rep')
          setUserApproved(true) // По умолчанию одобрен для совместимости
        })
      }
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
    try {
      await supabase.auth.signOut()
      // Принудительно сбрасываем все состояния
      setUser(null)
      setUserRole('sales_rep')
      setUserApproved(true)
      setCurrentPage('order')
      setMobileMenuOpen(false)
    } catch {
      // В случае ошибки всё равно сбрасываем состояния
      setUser(null)
      setUserRole('sales_rep')
      setUserApproved(true)
      setCurrentPage('order')
      setMobileMenuOpen(false)
    }
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
          // Небольшая задержка для синхронизации с auth.users
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Пытаемся создать профиль несколько раз
          let profileCreated = false
          let attempts = 0
          const maxAttempts = 3
          
          while (!profileCreated && attempts < maxAttempts) {
            attempts++
            
            try {
              const { error: profileError } = await supabase
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
                if (attempts === maxAttempts) {
                  // Последняя попытка неудачна
                  setAuthError(`Пользователь зарегистрирован, но не удалось создать профиль. Код ошибки: ${profileError.code}. Попробуйте войти в систему позже или обратитесь к администратору.`)
                  break
                } else {
                  // Ждем перед следующей попыткой
                  await new Promise(resolve => setTimeout(resolve, 2000))
                }
              } else {
                profileCreated = true
                // Показываем сообщение об успешной регистрации
                setAuthError('')
              }
            } catch {
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

  // Экран блокировки пользователя
  if (user && !userApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7a2 2 0 00-4 0v2m0 0a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2V7a2 2 0 00-4 0z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Аккаунт заблокирован
          </h2>
          <p className="text-gray-600 mb-6">
            Ваш аккаунт ожидает одобрения администратора. Пожалуйста, свяжитесь с руководством для активации доступа.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Выйти из аккаунта
          </button>
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
