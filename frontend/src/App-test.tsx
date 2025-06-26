import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [showModal, setShowModal] = useState<'login' | 'register' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setMessage('')
    setShowModal(null)
  }

  // Обработка клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        resetForm()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showModal])

  const handleRegister = async () => {
    if (!email || !password) {
      setMessage('Заполните все поля')
      return
    }
    // Временно отключаем Supabase для тестирования
    setMessage('Регистрация прошла успешно! (тестовый режим)')
    setTimeout(resetForm, 2000)
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Заполните все поля')
      return
    }
    // Временно отключаем Supabase для тестирования
    setMessage('Вход выполнен! (тестовый режим)')
    setTimeout(resetForm, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5 flex items-center justify-content">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-3xl p-8 md:p-12 text-center shadow-2xl max-w-lg w-full transition-transform duration-300 hover:-translate-y-1">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Форма заказа
        </h1>
        <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 leading-relaxed">
          Быстрое оформление заказов, управление клиентами и товарами.<br className="hidden md:block" />
          Присоединяйтесь к нашей платформе для эффективной работы.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-10">
          <button
            className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            onClick={() => setShowModal('login')}
          >
            🔑 Войти
          </button>
          <button
            className="flex-1 py-4 px-6 bg-indigo-50 text-indigo-600 font-semibold rounded-xl border-2 border-indigo-200 hover:bg-indigo-100 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            onClick={() => setShowModal('register')}
          >
            ✨ Зарегистрироваться
          </button>
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-5 z-50 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div className="bg-white rounded-2xl p-6 md:p-10 w-full max-w-md mx-auto shadow-2xl transform scale-90 animate-modal-slide relative">
            <button
              onClick={resetForm}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-300 leading-none"
            >
              ×
            </button>
            
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                {showModal === 'login' ? 'Вход в систему' : 'Создать аккаунт'}
              </h2>
              <p className="text-slate-500 text-sm md:text-base">
                {showModal === 'login' 
                  ? 'Введите свои учетные данные' 
                  : 'Заполните данные для регистрации'
                }
              </p>
            </div>
            
            <div className="space-y-4 md:space-y-5">
              <div className="form-group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm">
                  📧 Email адрес
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 md:py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-lg transition-all duration-300 text-base"
                  placeholder="example@company.com"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm">
                  🔒 Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 md:py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-lg transition-all duration-300 text-base"
                  placeholder={showModal === 'login' ? 'Введите ваш пароль' : 'Введите надежный пароль'}
                />
              </div>
              
              {message && (
                <div className={`p-3 md:p-4 rounded-xl text-sm font-medium ${
                  message.includes('успешно') || message.includes('выполнен') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
              
              <div className="flex gap-3 pt-6 md:pt-8">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 md:py-3.5 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                >
                  Отмена
                </button>
                <button
                  onClick={showModal === 'login' ? handleLogin : handleRegister}
                  className="py-3 md:py-3.5 px-4 md:px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
                  style={{ flex: 2 }}
                >
                  {showModal === 'login' ? '🔑 Войти' : '✨ Создать аккаунт'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
