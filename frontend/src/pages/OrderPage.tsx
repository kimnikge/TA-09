import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const OrderPage: React.FC = () => {
  const [clientId, setClientId] = useState<number | null>(null);
  const [items, setItems] = useState<{ productId: number; qty: number }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: clientsData } = await supabase.from('clients').select('id, name');
      const { data: productsData } = await supabase.from('products').select('id, name, price');
      setClients(clientsData || []);
      setProducts(productsData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleQtyChange = (productId: number, qty: number) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.productId === productId);
      if (exists) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
      } else {
        return [...prev, { productId, qty }];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setStatus('Выберите клиента');
      return;
    }
    const orderItems = items.filter((i) => i.qty > 0);
    if (orderItems.length === 0) {
      setStatus('Добавьте хотя бы один товар');
      return;
    }
    setStatus('Создание заказа...');
    const { data: order, error: orderError } = await supabase.from('orders').insert({ client_id: clientId }).select().single();
    if (orderError || !order) {
      setStatus('Ошибка при создании заказа');
      return;
    }
    const orderItemsData = orderItems.map((i) => ({ order_id: order.id, product_id: i.productId, quantity: i.qty }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsError) {
      setStatus('Ошибка при добавлении товаров в заказ');
      return;
    }
    setStatus('Заказ успешно создан!');
    setItems([]);
    setClientId(null);
  };

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
        Форма заказа
      </h1>
      
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          fontSize: '1.1rem',
          color: '#667eea'
        }}>
          Загрузка...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Выбор клиента */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              Клиент:
            </label>
            <select
              value={clientId ?? ''}
              onChange={(e) => setClientId(Number(e.target.value) || null)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">-- выберите --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Заголовок товаров */}
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '0.5rem'
          }}>
            Товары
          </h3>

          {/* Таблица товаров - адаптивная */}
          {isMobile ? (
            // Мобильная версия - карточки
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {products.map((p) => (
                <div key={p.id} style={{
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <strong style={{ color: '#2d3748' }}>{p.name}</strong>
                    <span style={{ 
                      color: '#667eea',
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}>
                      {p.price} ₽
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <label style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      Количество:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={items.find((i) => i.productId === p.id)?.qty ?? 0}
                      onChange={(e) => handleQtyChange(p.id, Number(e.target.value))}
                      style={{
                        padding: '0.5rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        width: '80px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Десктопная версия - таблица
            <div style={{
              overflowX: 'auto',
              border: '2px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      borderBottom: '2px solid #e2e8f0',
                      color: '#2d3748',
                      fontWeight: '600'
                    }}>
                      Название
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      borderBottom: '2px solid #e2e8f0',
                      color: '#2d3748',
                      fontWeight: '600'
                    }}>
                      Цена
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      borderBottom: '2px solid #e2e8f0',
                      color: '#2d3748',
                      fontWeight: '600'
                    }}>
                      Кол-во
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <td style={{
                        padding: '1rem',
                        color: '#2d3748'
                      }}>
                        {p.name}
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#667eea',
                        fontWeight: '600'
                      }}>
                        {p.price} ₽
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <input
                          type="number"
                          min={0}
                          value={items.find((i) => i.productId === p.id)?.qty ?? 0}
                          onChange={(e) => handleQtyChange(p.id, Number(e.target.value))}
                          style={{
                            padding: '0.5rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            width: '80px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Кнопка создания заказа */}
          <button 
            type="submit"
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '1rem'
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
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            Создать заказ
          </button>
        </form>
      )}
      
      {/* Статус сообщение */}
      {status && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '1rem',
          fontWeight: '600',
          background: status.includes('успешно') ? '#d4edda' : 
                     status.includes('Ошибка') ? '#f8d7da' : '#cce7ff',
          color: status.includes('успешно') ? '#155724' : 
                 status.includes('Ошибка') ? '#721c24' : '#004085',
          border: `2px solid ${status.includes('успешно') ? '#c3e6cb' : 
                                status.includes('Ошибка') ? '#f5c6cb' : '#b8daff'}`
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default OrderPage;