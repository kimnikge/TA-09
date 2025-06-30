import React, { useState, useEffect } from 'react';
import { ShoppingCart, Filter, Calendar } from 'lucide-react';
import { supabase } from '../../supabaseClient';

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

  useEffect(() => {
    loadOrders();
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка заказов...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Управление заказами</h2>
            <p className="text-sm text-gray-500 mt-1">
              Просматривайте и управляйте заказами клиентов ({orders.length} заказов)
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Экспорт
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-blue-800">Всего заказов</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.reduce((sum, order) => sum + order.total_items, 0)}
            </div>
            <div className="text-sm text-yellow-800">Всего позиций</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {orders.reduce((sum, order) => sum + order.total_price, 0).toLocaleString()} ₸
            </div>
            <div className="text-sm text-green-800">Общая сумма</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length).toLocaleString() : 0} ₸
            </div>
            <div className="text-sm text-purple-800">Средний чек</div>
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

              return (
                <div key={order.id} className="border border-gray-200 rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="flex items-center justify-between">
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
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Позиции заказа:</h4>
                      {items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
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
