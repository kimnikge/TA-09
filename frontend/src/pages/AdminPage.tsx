import React, { useState, useEffect } from 'react';

const AdminPage: React.FC = () => {
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
        Админ-панель
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
          lineHeight: '1.6'
        }}>
          Здесь будет управление прайсом, точками продаж и отчётами.
        </p>
        
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '0.5rem'
            }}>
              Управление прайсом
            </h3>
            <p style={{ color: '#667eea', fontSize: '0.9rem' }}>
              Добавление и редактирование товаров
            </p>
          </div>
          
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '0.5rem'
            }}>
              Точки продаж
            </h3>
            <p style={{ color: '#667eea', fontSize: '0.9rem' }}>
              Управление клиентами и торговыми точками
            </p>
          </div>
          
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '0.5rem'
            }}>
              Отчёты
            </h3>
            <p style={{ color: '#667eea', fontSize: '0.9rem' }}>
              Статистика и аналитика продаж
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 