import { useState, useEffect } from 'react'
import './App.css'

// Простая тестовая версия для диагностики Safari
function AppSafariTest() {
  const [currentPage, setCurrentPage] = useState<'order' | 'clients' | 'admin'>('order')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log('🔧 Safari Test: Компонент инициализирован')
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7fafc',
        fontSize: '18px',
        color: '#2d3748'
      }}>
        Загрузка...
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: '#f7fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Простая навигация */}
      <nav style={{
        background: '#667eea',
        padding: '1rem 2rem',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
          Тест Safari
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setCurrentPage('admin')}
            style={{
              background: currentPage === 'admin' ? 'rgba(255,255,255,0.3)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Админ-панель
          </button>
          
          <button
            onClick={() => setCurrentPage('order')}
            style={{
              background: currentPage === 'order' ? 'rgba(255,255,255,0.3)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',  
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer'
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
              cursor: 'pointer'
            }}
          >
            Клиенты
          </button>
        </div>
      </nav>

      {/* Основное содержимое */}
      <main style={{ padding: '2rem' }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem',
            color: '#2d3748'
          }}>
            Активная страница: {currentPage.toUpperCase()}
          </h2>
          
          {currentPage === 'admin' && (
            <div style={{
              padding: '1rem',
              background: '#ffcdd2',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <h3>Админ-панель</h3>
              <p>Это тестовое содержимое админ-панели</p>
            </div>
          )}
          
          {currentPage === 'order' && (
            <div style={{
              padding: '1rem',
              background: '#c8e6c9',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <h3>Страница заказов</h3>
              <p>Это тестовое содержимое страницы заказов</p>
            </div>
          )}
          
          {currentPage === 'clients' && (
            <div style={{
              padding: '1rem',
              background: '#bbdefb',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <h3>Страница клиентов</h3>
              <p>Это тестовое содержимое страницы клиентов</p>
            </div>
          )}
        </div>
        
        {/* Информация о браузере */}
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '0.9rem',
          color: '#718096'
        }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Информация о браузере:</h4>
          <p>User Agent: {navigator.userAgent}</p>
          <p>Размер окна: {window.innerWidth} x {window.innerHeight}</p>
        </div>
      </main>
    </div>
  )
}

export default AppSafariTest
