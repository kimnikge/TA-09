import React, { useState, useEffect } from 'react';

const ClientsPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  // Проверка размера экрана  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      margin: isMobile ? '0' : '0 auto',
      maxWidth: isMobile ? '100%' : '1000px'
    }}>
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#2d3748',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        Клиенты
      </h1>
      
      <div style={{
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '2px solid #e2e8f0',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          color: '#4a5568',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          Здесь будет список и добавление торговых точек (клиентов).
        </p>
        
        {/* Кнопка добавления клиента */}
        <button style={{
          padding: '1rem 2rem',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '2rem',
          width: isMobile ? '100%' : 'auto'
        }}>
          + Добавить клиента
        </button>
        
        {/* Заглушка для списка клиентов */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {/* Примеры карточек клиентов */}
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                Клиент #{i}
              </h3>
              <p style={{
                color: '#667eea',
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}>
                Адрес: ул. Примерная, д. {i}
              </p>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button style={{
                  padding: '0.5rem 1rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  flex: '1'
                }}>
                  Редактировать
                </button>
                <button style={{
                  padding: '0.5rem 1rem',
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  flex: '1'
                }}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage; 