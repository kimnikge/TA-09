import { useState, useEffect } from 'react'
import './App.css'
import AdminPage from './pages/AdminPage'
import OrderPage from './pages/OrderPage'
import ClientsPage from './pages/ClientsPage'
// import { supabase } from './supabaseClient'

function App() {
  const [showModal, setShowModal] = useState<'login' | 'register' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'sales_rep' | null>(null)
  const [currentPage, setCurrentPage] = useState<'order' | 'clients' | 'admin'>('order')
  const [currentUser, setCurrentUser] = useState<string>('')

  // Проверка размера экрана
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setMessage('')
    setShowModal(null)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentUser('')
    setCurrentPage('order')
    resetForm()
  }

  // Обработка клавиши Escape и блокировка прокрутки
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        resetForm()
      }
    }

    if (showModal) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [showModal])

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      setMessage('Заполните все поля')
      return
    }
    // const { error } = await supabase.auth.signUp({ email, password })
    // if (error) {
    //   setMessage('Ошибка регистрации: ' + error.message)
    // } else {
      setMessage('Регистрация успешна!')
      setTimeout(resetForm, 2000)
    // }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage('Заполните все поля')
      return
    }
    
    // Временная логика для демонстрации - определяем роль по email
    let role: 'admin' | 'sales_rep' = 'sales_rep'
    if (email.includes('admin')) {
      role = 'admin'
    }
    
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // if (error) {
    //   setMessage('Ошибка входа: ' + error.message)
    //   return
    // }
    // // Проверяем статус подтверждения
    // const { data: profile, error: profileError } = await supabase
    //   .from('profiles')
    //   .select('approved, role')
    //   .eq('id', data.user.id)
    //   .single()
    // if (profileError) {
    //   setMessage('Ошибка проверки статуса: ' + profileError.message)
    //   return
    // }
    // if (!profile?.approved) {
    //   setMessage('Ваша регистрация ещё не подтверждена администратором.')
    //   await supabase.auth.signOut()
    //   return
    // }
    
    setMessage('Вход выполнен успешно!')
    setUserRole(role)
    setIsAuthenticated(true)
    setCurrentUser(email)
    
    // Устанавливаем стартовую страницу в зависимости от роли
    if (role === 'admin') {
      setCurrentPage('admin')
    } else {
      setCurrentPage('order')
    }
    
    setTimeout(() => {
      resetForm()
    }, 1000)
  }

  // Если пользователь аутентифицирован, показываем соответствующую страницу
  if (isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
        {/* Навигационная панель */}
        <nav style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '1rem 2rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Форма заказа
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Информация о пользователе */}
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {currentUser} ({userRole === 'admin' ? 'Администратор' : 'Торговый представитель'})
            </span>
            
            {/* Кнопки навигации */}
            {userRole === 'admin' && (
              <button
                onClick={() => setCurrentPage('admin')}
                style={{
                  background: currentPage === 'admin' ? 'rgba(255,255,255,0.3)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Админ-панель
              </button>
            )}
            
            <button
              onClick={() => setCurrentPage('order')}
              style={{
                background: currentPage === 'order' ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Заказы
            </button>
            
            <button
              onClick={() => setCurrentPage('clients')}
              style={{
                background: currentPage === 'clients' ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Клиенты
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                background: '#dc3545',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Выйти
            </button>
          </div>
        </nav>

        {/* Содержимое страницы */}
        <main style={{ padding: '2rem' }}>
          {currentPage === 'admin' && userRole === 'admin' && <AdminPage />}
          {currentPage === 'order' && <OrderPage />}
          {currentPage === 'clients' && <ClientsPage />}
        </main>
      </div>
    )
  }

  // Страница входа/регистрации (если не аутентифицирован)
  return (
    <div 
      className="min-h-screen flex items-center justify-center main-container"
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: isMobile ? '10px' : '20px',
        minHeight: isMobile ? '100dvh' : '100vh', // Динамическая высота viewport для мобильных
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto'
      }}
    >
      <div 
        className={`text-center w-full transition-transform duration-300 container-main ${isMobile ? 'container-mobile' : ''}`}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: isMobile ? '40px 24px' : '60px 40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-5px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <h1 
          className={`font-bold mb-4 main-title ${isMobile ? 'title-mobile' : ''}`}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '700',
            color: '#2d3748',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Форма заказа
        </h1>
        <p 
          className="leading-relaxed"
          style={{
            fontSize: '1.1rem',
            color: '#718096',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}
        >
          Быстрое оформление заказов, управление клиентами и товарами.<br />
          Присоединяйтесь к платформе.
        </p>
        
        <div 
          className={isMobile ? 'buttons-mobile' : ''}
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            marginBottom: '40px',
            width: '100%'
          }}
        >
          <button
            className={isMobile ? 'button-mobile' : ''}
            style={{
              flex: isMobile ? 'none' : '1',
              width: isMobile ? '100%' : 'auto',
              padding: '16px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }
            }}
            onClick={() => setShowModal('login')}
          >
            🔑 Войти
          </button>
          <button
            className={isMobile ? 'button-mobile' : ''}
            style={{
              flex: isMobile ? 'none' : '1',
              width: isMobile ? '100%' : 'auto',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              border: '2px solid rgba(102, 126, 234, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onClick={() => setShowModal('register')}
          >
            ✨ Зарегистрироваться
          </button>
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ 
            display: 'flex',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: '1000',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '10px' : '20px',
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div 
            className={`bg-white w-full relative modal-content-mobile ${isMobile ? 'modal-mobile' : ''}`}
            style={{
              background: 'white',
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '24px 16px' : '40px',
              maxWidth: isMobile ? '95vw' : '450px',
              width: '100%',
              maxHeight: isMobile ? '90vh' : 'auto',
              overflowY: isMobile ? 'auto' : 'visible',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
              transform: 'scale(0.9)',
              animation: 'modalSlide 0.3s ease forwards'
            }}
          >
            <button
              onClick={resetForm}
              className="absolute text-2xl bg-transparent border-0 cursor-pointer transition-colors duration-300"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#a0aec0',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#718096'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
            >
              ×
            </button>
            
            <div 
              className="text-center"
              style={{
                textAlign: 'center',
                marginBottom: isMobile ? '20px' : '30px'
              }}
            >
              <h2 
                className="font-bold mb-2"
                style={{
                  fontSize: isMobile ? '1.5rem' : '1.8rem',
                  fontWeight: '700',
                  color: '#2d3748',
                  marginBottom: '8px'
                }}
              >
                {showModal === 'login' ? 'Вход в систему' : 'Создать аккаунт'}
              </h2>
              <p 
                style={{
                  color: '#718096',
                  fontSize: isMobile ? '0.85rem' : '0.95rem'
                }}
              >
                {showModal === 'login' 
                  ? 'Введите свои учетные данные' 
                  : 'Заполните данные для регистрации'
                }
              </p>
            </div>
            
            <div>
              <form onSubmit={(e) => {
                e.preventDefault()
                if (showModal === 'login') {
                  handleLogin()
                } else {
                  handleRegister()
                }
              }}>
              <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                <label 
                  className="block font-semibold mb-2"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2d3748',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}
                >
                  📧 Email адрес
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full transition-all duration-300"
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px' : '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: isMobile ? '8px' : '12px',
                    fontSize: isMobile ? '16px' : '1rem', // 16px предотвращает зум на iOS
                    background: '#f8fafc',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="example@company.com"
                />
              </div>
              
              <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                <label 
                  className="block font-semibold mb-2"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2d3748',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}
                >
                  🔒 Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full transition-all duration-300"
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px' : '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: isMobile ? '8px' : '12px',
                    fontSize: isMobile ? '16px' : '1rem', // 16px предотвращает зум на iOS
                    background: '#f8fafc',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder={showModal === 'login' ? 'Введите ваш пароль' : 'Введите надежный пароль'}
                />
              </div>
              
              {showModal === 'register' && (
                <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                  <label 
                    className="block font-semibold mb-2"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#2d3748',
                      fontSize: isMobile ? '0.85rem' : '0.9rem'
                    }}
                  >
                    👤 Имя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full transition-all duration-300"
                    style={{
                      width: '100%',
                      padding: isMobile ? '12px' : '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: isMobile ? '8px' : '12px',
                      fontSize: isMobile ? '16px' : '1rem', // 16px предотвращает зум на iOS
                      background: '#f8fafc',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.outline = 'none';
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Ваше имя"
                    required
                  />
                </div>
              )}
              
              {message && (
                <div className={`rounded-xl text-sm font-medium border mb-5 ${
                  message.includes('успешно') || message.includes('выполнен') 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`} style={{ padding: '16px' }}>
                  {message}
                </div>
              )}
              
              <div 
                className="flex gap-3"
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '8px' : '12px',
                  marginTop: isMobile ? '20px' : '30px'
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 font-semibold cursor-pointer transition-all duration-300"
                  style={{
                    flex: isMobile ? 'none' : '1',
                    width: isMobile ? '100%' : 'auto',
                    padding: isMobile ? '12px' : '14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: isMobile ? '8px' : '12px',
                    background: 'white',
                    color: '#718096',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e0';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="font-semibold cursor-pointer transition-all duration-300"
                  style={{
                    flex: isMobile ? 'none' : '2',
                    width: isMobile ? '100%' : 'auto',
                    padding: isMobile ? '12px' : '14px',
                    border: 'none',
                    borderRadius: isMobile ? '8px' : '12px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  {showModal === 'login' ? '🔑 Войти' : '✨ Создать аккаунт'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App