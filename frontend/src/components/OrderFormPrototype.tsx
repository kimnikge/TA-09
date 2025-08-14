import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import AlertMessage from './common/AlertMessage';
import { log } from '../utils/logger';

interface Product {
  id: string; // UUID в Supabase
  name: string;
  price: number;
  unit: string | null;
  category: string;
  image_url?: string | null;
  active?: boolean;
}

interface Client {
  id: string; // UUID в Supabase
  name: string;
  address: string;
  created_by?: string | null;
  created_at?: string;
}

interface Cart {
  [productId: string]: number;
}

interface Comments {
  [productId: string]: string;
}

interface OrderFormProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

const OrderFormPrototype: React.FC<OrderFormProps> = ({ currentUser }) => {
  // Используем реальные данные пользователя
  const currentAgent = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email
  };

  // Стейты для данных из Supabase
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [selectedClient, setSelectedClient] = useState<string>('');
  
  // Автоматически устанавливаем дату доставки на завтра
  const deliveryDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  })();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('beverages');
  const [cart, setCart] = useState<Cart>({});
  const [comments, setComments] = useState<Comments>({});
  const [showNewClientModal, setShowNewClientModal] = useState<boolean>(false);
  // Изображения и модалка отключены для упрощения мобильной вёрстки
  const [newClient, setNewClient] = useState<{
    name: string;
    address: string;
  }>({
    name: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedProductNotification, setAddedProductNotification] = useState<string | null>(null);
  const [notice, setNotice] = useState<{type: 'success'|'error'|'warning'|'info'; message: string} | null>(null);

  // Загрузка данных из Supabase
  useEffect(() => {
    const loadDataOnMount = async () => {
      try {
        // Загружаем клиентов
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('name');

        if (clientsError) {
          console.error('Ошибка загрузки клиентов:', clientsError);
          setClients([]);
        } else {
          setClients(clientsData || []);
        }

        // Загружаем только активные товары
        console.log('🔍 OrderForm: Начинаем загрузку товаров...');
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .neq('active', false) // Исключаем деактивированные товары
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        console.log('📦 OrderForm: Товары из БД:', productsData);
        console.log('❌ OrderForm: Ошибка загрузки товаров:', productsError);

        if (productsError) {
          console.error('❌ OrderForm: Ошибка загрузки товаров:', productsError);
          setProducts([]);
        } else {
          console.log(`✅ OrderForm: Загружено товаров: ${(productsData || []).length}`);
          setProducts(productsData || []);
        }

        // Создаём список категорий из загруженных товаров
        const uniqueCategories = [...new Set((productsData || []).map(p => p.category))];
        const categoryList = uniqueCategories.map(cat => ({
          id: cat,
          name: getCategoryName(cat)
        }));
        setCategories(categoryList);

        // Устанавливаем первую категорию как выбранную, если есть товары
        if (categoryList.length > 0 && !selectedCategory) {
          setSelectedCategory(categoryList[0].id);
        }

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    loadDataOnMount();
  }, [selectedCategory]);

  // Функция для получения русского названия категории
  const getCategoryName = (categoryId: string): string => {
    const categoryNames: { [key: string]: string } = {
      'beverages': 'Напитки',
      'snacks': 'Снеки',
      'dairy': 'Молочные продукты',
      'household': 'Бытовая химия',
      'food': 'Продукты питания',
      'bakery': 'Хлебобулочные изделия',
      'meat': 'Мясные продукты',
      'frozen': 'Замороженные продукты'
    };
    return categoryNames[categoryId] || categoryId;
  };

  const updateQuantity = (productId: string, change: number) => {
    const product = products.find(p => p.id === productId);
    console.log('OrderForm: updateQuantity вызван', { productId, change, productName: product?.name });
  log.ui('OrderForm: updateQuantity', { productId, change, productName: product?.name });
    
    setCart(prev => {
      const newCart = { ...prev };
      const currentQty = newCart[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = newQty;
        
        // Показываем уведомление о добавлении товара
        if (change > 0 && product) {
          setAddedProductNotification(`${product.name} добавлен в корзину`);
          setTimeout(() => setAddedProductNotification(null), 3000);
        }
      }
      
      console.log('OrderForm: корзина обновлена', newCart);
  log.ui('OrderForm: корзина обновлена', newCart);
      return newCart;
    });
  };

  const setQuantityDirectly = (productId: string, value: string) => {
    const product = products.find(p => p.id === productId);
    
    // Разрешаем пустое значение для редактирования
    if (value === '') {
      setCart(prev => {
        const newCart = { ...prev };
        newCart[productId] = 0; // Временно устанавливаем 0 для редактирования
        return newCart;
      });
      return;
    }
    
    const qty = parseInt(value) || 0;
    setCart(prev => {
      const newCart = { ...prev };
      
      if (qty <= 0) {
        delete newCart[productId];
        if (product && value !== '') {
          setAddedProductNotification(`${product.name} удален из корзины`);
          setTimeout(() => setAddedProductNotification(null), 3000);
        }
      } else {
        newCart[productId] = qty;
      }
      
      return newCart;
    });
  };

  // Новая функция для обработки потери фокуса
  const handleQuantityBlur = (productId: string, value: string) => {
    const qty = parseInt(value) || 0;
    if (qty <= 0) {
      // Если значение пустое или 0, устанавливаем минимум 1
      setCart(prev => {
        const newCart = { ...prev };
        newCart[productId] = 1;
        return newCart;
      });
    }
  };

  const addNewClient = async () => {
    if (!newClient.name || !newClient.address) {
      setNotice({ type: 'warning', message: 'Пожалуйста, заполните название и адрес клиента' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Создаем клиента в базе данных
      const { data: createdClient, error: clientError } = await supabase
        .from('clients')
        .insert([
          {
            name: newClient.name.trim(),
            address: newClient.address.trim(),
            created_by: currentAgent.id
          }
        ])
        .select()
        .single();

      if (clientError) {
        console.error('❌ Ошибка создания клиента:', clientError);
        throw new Error(`Ошибка создания клиента: ${clientError.message}`);
      }

      if (!createdClient) {
        throw new Error('Клиент не был создан');
      }

      console.log('✅ Клиент успешно создан:', createdClient);

      // Добавляем нового клиента в локальный список
      const newClientData: Client = {
        id: createdClient.id,
        name: createdClient.name,
        address: createdClient.address,
        created_by: createdClient.created_by,
        created_at: createdClient.created_at
      };

      setClients(prev => [...prev, newClientData]);
      setSelectedClient(createdClient.id);
      setShowNewClientModal(false);
      setNewClient({ name: '', address: '' });
      
      setNotice({ type: 'success', message: 'Клиент успешно создан!' });
      
    } catch (error) {
      log.error('Ошибка создания клиента', error instanceof Error ? { message: error.message, stack: error.stack } : String(error));
      setNotice({ type: 'error', message: `Ошибка создания клиента: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedClient || Object.keys(cart).length === 0) {
      setNotice({ type: 'warning', message: 'Выберите клиента и добавьте товары в заказ' });
      return;
    }
    
    if (!currentAgent.id) {
      setNotice({ type: 'error', message: 'Ошибка: не удалось определить пользователя' });
      return;
    }

    // Проверяем, что выбранный клиент существует в списке
    const clientExists = clients.find(c => c.id === selectedClient);
    if (!clientExists) {
      setNotice({ type: 'error', message: 'Ошибка: выбранный клиент не найден. Попробуйте обновить страницу.' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      log.db('Создание заказа', { client: clientExists.name, clientId: selectedClient });
      
      // 1. Проверяем, что клиент существует в базе данных
      const { data: clientCheck, error: clientCheckError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', selectedClient)
        .single();

      if (clientCheckError || !clientCheck) {
        console.error('❌ Клиент не найден в базе данных:', clientCheckError);
        throw new Error('Выбранный клиент не найден в базе данных. Попробуйте создать клиента заново.');
      }

      console.log('✅ Клиент найден в базе данных:', clientCheck.name);
  log.db('Клиент найден', { name: clientCheck.name });

      // 2. Создать заказ
      const orderData = {
        rep_id: currentAgent.id,
        client_id: selectedClient,
        delivery_date: deliveryDate,
        total_items: getTotalItems(),
        total_price: getTotalPrice()
      };

      console.log('🔄 Создание заказа с данными:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        log.error('Ошибка создания заказа', { message: orderError.message });
        setNotice({ type: 'error', message: `Ошибка создания заказа: ${orderError.message}` });
        return;
      }
      
      if (!order) {
        setNotice({ type: 'error', message: 'Заказ не был создан' });
        return;
      }

      console.log('✅ Заказ успешно создан:', order.id);

      // 2. Добавить позиции заказа
      const items = Object.entries(cart).map(([productId, qty]) => {
        const product = products.find(p => p.id === productId);
        if (!product) {
          throw new Error(`Товар с ID ${productId} не найден`);
        }
        
        return {
          order_id: order.id,
          product_id: productId,
          quantity: qty,
          price: product.price,
          unit: product.unit || 'шт',
          comment: comments[productId] || ''
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      
      if (itemsError) {
        log.error('Ошибка добавления позиций', { message: itemsError.message });
        await supabase.from('orders').delete().eq('id', order.id);
        setNotice({ type: 'error', message: `Ошибка добавления позиций: ${itemsError.message}` });
        return;
      }

      setCart({});
      setComments({});
      setNotice({ type: 'success', message: 'Заявка успешно отправлена!' });
    } catch (error) {
      log.error('Ошибка отправки заказа', error instanceof Error ? { message: error.message, stack: error.stack } : String(error));
      setNotice({ type: 'error', message: `Ошибка отправки заказа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Утилиты
  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, qty]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * qty : 0);
    }, 0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Создание заказа</h1>
        
        {notice && (
          <div className="mb-4">
            <AlertMessage type={notice.type} message={notice.message} />
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Клиент
            </label>
            <div className="flex">
              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Выберите клиента</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.address})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewClientModal(true)}
                className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-5 h-5 mr-1" />
                Новый клиент
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата доставки
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={() => {}}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Товары
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.filter(p => p.category === selectedCategory).map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <div className="text-gray-500">
                    {product.price} ₽ / {product.unit}
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={cart[product.id] || 0}
                    onChange={e => setQuantityDirectly(product.id, e.target.value)}
                    onBlur={e => handleQuantityBlur(product.id, e.target.value)}
                    className="mx-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center"
                  />
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    −
                  </button>
                </div>
                {comments[product.id] && (
                  <div className="mt-2 text-sm text-gray-500">
                    Комментарий: {comments[product.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              onClick={handleSubmitOrder}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить заказ'}
            </button>
          </div>
        </div>
        
        {addedProductNotification && (
          <div className="mb-4">
            <AlertMessage type="info" message={addedProductNotification} />
          </div>
        )}
        
        {/* Модалка для нового клиента */}
        {showNewClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">Новый клиент</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название клиента
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес клиента
                </label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Отмена
                </button>
                <button
                  onClick={addNewClient}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Создание...' : 'Создать клиента'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFormPrototype;
