import React, { useState, useEffect } from 'react';
import { ShoppingCart, Filter, Calendar, Download } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Простая утилита для создания CSV без внешних зависимостей
const createCSV = (data: Record<string, unknown>[], delimiter = ';') => {
  if (data.length === 0) return '';
  
  const keys = Object.keys(data[0]);
  const csvHeaders = keys.join(delimiter);
  const csvRows = data.map(row => 
    keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      // Экранируем запятые и кавычки
      if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(delimiter)
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

interface Order {
  id: string;
  rep_id: string;
  client_id: string;
  delivery_date: string;
  total_items: number;
  total_price: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  unit: string;
  comment?: string;
  product_name?: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
  address: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

const OrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: OrderItem[] }>({});
  const [clients, setClients] = useState<{ [clientId: string]: Client }>({});
  const [profiles, setProfiles] = useState<{ [profileId: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  // Состояние для отслеживания просмотренных заказов
  const [viewedOrders, setViewedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
    // Загружаем просмотренные заказы из localStorage
    const saved = localStorage.getItem('viewedOrders');
    if (saved) {
      setViewedOrders(new Set(JSON.parse(saved)));
    }
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Загружаем заказы
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Загружаем связанные данные
      if (ordersData && ordersData.length > 0) {
        // Получаем уникальные ID клиентов и менеджеров
        const clientIds = [...new Set(ordersData.map(o => o.client_id))];
        const profileIds = [...new Set(ordersData.map(o => o.rep_id))];

        // Загружаем клиентов
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds);

        // Загружаем профили менеджеров
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);

        // Преобразуем в объекты для быстрого доступа
        const clientsMap: { [key: string]: Client } = {};
        clientsData?.forEach(client => {
          clientsMap[client.id] = client;
        });

        const profilesMap: { [key: string]: Profile } = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });

        setClients(clientsMap);
        setProfiles(profilesMap);
      }

    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;

      // Загружаем информацию о товарах
      if (items && items.length > 0) {
        const productIds = items.map(item => item.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        const productsMap: { [key: string]: string } = {};
        products?.forEach(product => {
          productsMap[product.id] = product.name;
        });

        const itemsWithProducts = items.map(item => ({
          ...item,
          product_name: productsMap[item.product_id] || 'Неизвестный товар'
        }));

        setOrderItems(prev => ({
          ...prev,
          [orderId]: itemsWithProducts
        }));
      }

    } catch (error) {
      console.error('Ошибка загрузки позиций заказа:', error);
    }
  };

  const handleOrderClick = (orderId: string) => {
    setSelectedOrder(selectedOrder === orderId ? null : orderId);
    if (selectedOrder !== orderId && !orderItems[orderId]) {
      loadOrderItems(orderId);
    }
    
    // Помечаем заказ как просмотренный
    if (!viewedOrders.has(orderId)) {
      const newViewedOrders = new Set(viewedOrders);
      newViewedOrders.add(orderId);
      setViewedOrders(newViewedOrders);
      // Сохраняем в localStorage
      localStorage.setItem('viewedOrders', JSON.stringify(Array.from(newViewedOrders)));
    }
  };

  // Функция для экспорта заказов в CSV
  const exportOrdersToCSV = async () => {
    try {
      // Подготавливаем данные для экспорта
      const exportData = [];

      for (const order of orders) {
        const client = clients[order.client_id];
        const manager = profiles[order.rep_id];

        // Если позиции заказа не загружены, загружаем их
        let items = orderItems[order.id];
        if (!items) {
          const { data: itemsData, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (!error && itemsData) {
            const productIds = itemsData.map(item => item.product_id);
            const { data: products } = await supabase
              .from('products')
              .select('id, name')
              .in('id', productIds);

            const productsMap: { [key: string]: string } = {};
            products?.forEach(product => {
              productsMap[product.id] = product.name;
            });

            items = itemsData.map(item => ({
              ...item,
              product_name: productsMap[item.product_id] || 'Неизвестный товар'
            }));
          } else {
            items = [];
          }
        }

        // Добавляем строку для каждой позиции заказа
        if (items && items.length > 0) {
          items.forEach(item => {
            exportData.push({
              'ID заказа': order.id,
              'Дата заказа': new Date(order.created_at).toLocaleDateString('ru-RU'),
              'Время заказа': new Date(order.created_at).toLocaleTimeString('ru-RU'),
              'Дата доставки': order.delivery_date,
              'Клиент': client?.name || 'Неизвестен',
              'Компания': client?.company_name || '',
              'Адрес': client?.address || '',
              'Менеджер': manager?.name || 'Неизвестен',
              'Email менеджера': manager?.email || '',
              'Товар': item.product_name,
              'Количество': item.quantity,
              'Единица': item.unit || 'шт',
              'Цена за единицу': item.price,
              'Сумма позиции': item.quantity * item.price,
              'Комментарий': item.comment || '',
              'Общая сумма заказа': order.total_price,
              'Всего позиций в заказе': order.total_items
            });
          });
        } else {
          // Если нет позиций, добавляем общую информацию о заказе
          exportData.push({
            'ID заказа': order.id,
            'Дата заказа': new Date(order.created_at).toLocaleDateString('ru-RU'),
            'Время заказа': new Date(order.created_at).toLocaleTimeString('ru-RU'),
            'Дата доставки': order.delivery_date,
            'Клиент': client?.name || 'Неизвестен',
            'Компания': client?.company_name || '',
            'Адрес': client?.address || '',
            'Менеджер': manager?.name || 'Неизвестен',
            'Email менеджера': manager?.email || '',
            'Товар': 'Нет позиций',
            'Количество': 0,
            'Единица': '',
            'Цена за единицу': 0,
            'Сумма позиции': 0,
            'Комментарий': '',
            'Общая сумма заказа': order.total_price,
            'Всего позиций в заказе': order.total_items
          });
        }
      }

      // Конвертируем в CSV
      const csv = createCSV(exportData);

      // Создаем и скачиваем файл
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Экспорт завершен успешно');
    } catch (error) {
      console.error('❌ Ошибка экспорта:', error);
      alert('Ошибка при экспорте данных. Попробуйте снова.');
    }
  };

  // Экспорт статистики заказов
  const exportOrdersSummary = () => {
    const summaryData = [
      {
        'Метрика': 'Всего заказов',
        'Значение': orders.length
      },
      {
        'Метрика': 'Всего позиций',
        'Значение': orders.reduce((sum, order) => sum + order.total_items, 0)
      },
      {
        'Метрика': 'Общая сумма (₸)',
        'Значение': orders.reduce((sum, order) => sum + order.total_price, 0)
      },
      {
        'Метрика': 'Средний чек (₸)',
        'Значение': orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length) : 0
      }
    ];

    const csv = createCSV(summaryData);

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка заказов...</div>
      </div>
    );
  }

  // Подсчитываем новые заказы
  const newOrdersCount = orders.filter(order => !viewedOrders.has(order.id)).length;
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-medium text-gray-900">Управление заказами</h2>
              {newOrdersCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  {newOrdersCount} новых
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Просматривайте и управляйте заказами клиентов ({orders.length} заказов)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <div className="relative group">
              <button className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button
                  onClick={exportOrdersToCSV}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Детальный отчет
                </button>
                <button
                  onClick={exportOrdersSummary}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Сводка по заказам
                </button>
              </div>
            </div>
            <button className="w-full sm:w-auto border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center">
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-xs sm:text-sm text-blue-800">Всего заказов</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {orders.reduce((sum, order) => sum + order.total_items, 0)}
            </div>
            <div className="text-xs sm:text-sm text-yellow-800">Всего позиций</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {orders.reduce((sum, order) => sum + order.total_price, 0).toLocaleString()} ₸
            </div>
            <div className="text-xs sm:text-sm text-green-800">Общая сумма</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length).toLocaleString() : 0} ₸
            </div>
            <div className="text-xs sm:text-sm text-purple-800">Средний чек</div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Заказов пока нет</h3>
            <p className="text-gray-500">
              Когда клиенты начнут делать заказы, они появятся здесь
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const client = clients[order.client_id];
              const manager = profiles[order.rep_id];
              const isExpanded = selectedOrder === order.id;
              const items = orderItems[order.id] || [];
              const isNewOrder = !viewedOrders.has(order.id);

              return (
                <div key={order.id} className={`border rounded-lg transition-all duration-300 ${
                  isNewOrder 
                    ? 'border-blue-300 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                    : 'border-gray-200 bg-white'
                }`}>
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      isNewOrder 
                        ? 'hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleOrderClick(order.id)}
                  >
                    {/* Индикатор нового заказа */}
                    {isNewOrder && (
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                          Новый заказ
                        </span>
                      </div>
                    )}
                    {/* Десктоп версия */}
                    <div className="hidden lg:flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Заказ #{order.id.slice(0, 8)}...
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {client?.name || 'Неизвестный клиент'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {client?.company_name || client?.address || 'Нет данных'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {manager?.name || 'Неизвестный менеджер'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {manager?.email || 'Нет email'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {order.total_price.toLocaleString()} ₸
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.total_items} позиций
                        </p>
                        <p className="text-xs text-gray-400">
                          Доставка: {order.delivery_date}
                        </p>
                      </div>
                    </div>

                    {/* Мобильная версия */}
                    <div className="lg:hidden space-y-3">
                      {/* Индикатор нового заказа для мобильной версии */}
                      {isNewOrder && (
                        <div className="flex items-center justify-center py-2 px-3 bg-blue-100 rounded-lg border border-blue-200">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                            Новый заказ
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium text-base ${
                            isNewOrder ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            Заказ #{order.id.slice(0, 8)}...
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')} {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            isNewOrder ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {order.total_price.toLocaleString()} ₸
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.total_items} позиций
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">Клиент:</span>
                          <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                            {client?.name || 'Неизвестный клиент'}
                          </span>
                        </div>
                        
                        {client?.company_name && (
                          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Компания:</span>
                            <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                              {client.company_name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">Менеджер:</span>
                          <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                            {manager?.name || 'Неизвестный менеджер'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">Доставка:</span>
                          <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                            {order.delivery_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Позиции заказа:</h4>
                      {items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="bg-white rounded border">
                              {/* Десктоп версия позиций */}
                              <div className="hidden sm:flex justify-between items-center py-2 px-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.product_name}</p>
                                  {item.comment && (
                                    <p className="text-sm text-gray-500">Комментарий: {item.comment}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-900">
                                    {item.quantity} {item.unit} × {item.price.toLocaleString()} ₸
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    = {(item.quantity * item.price).toLocaleString()} ₸
                                  </p>
                                </div>
                              </div>

                              {/* Мобильная версия позиций */}
                              <div className="sm:hidden p-3 space-y-2">
                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Количество:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.quantity} {item.unit}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Цена за единицу:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.price.toLocaleString()} ₸
                                  </span>
                                </div>
                                <div className="flex justify-between items-center font-medium border-t pt-2">
                                  <span className="text-sm text-gray-700">Итого:</span>
                                  <span className="text-base font-bold text-gray-900">
                                    {(item.quantity * item.price).toLocaleString()} ₸
                                  </span>
                                </div>
                                {item.comment && (
                                  <div className="pt-2 border-t">
                                    <p className="text-sm text-gray-600">Комментарий:</p>
                                    <p className="text-sm text-gray-900">{item.comment}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Позиции загружаются...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersSection;
