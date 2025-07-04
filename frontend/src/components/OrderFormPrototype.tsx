import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, User, Package, Send, Eye, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

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
  userRole: 'admin' | 'sales_rep';
}

const OrderFormPrototype: React.FC<OrderFormProps> = ({ currentUser, userRole }) => {
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
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');

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
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [newClient, setNewClient] = useState<{
    name: string;
    address: string;
  }>({
    name: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Загрузка данных из Supabase
  useEffect(() => {
    const loadDataOnMount = async () => {
      try {
        setLoading(true);
        setLoadingMessage('Загрузка данных...');

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

        // Загружаем товары
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (productsError) {
          console.error('Ошибка загрузки товаров:', productsError);
          setProducts([]);
        } else {
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
      } finally {
        setLoading(false);
        setLoadingMessage('');
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
    setCart(prev => {
      const newCart = { ...prev };
      const currentQty = newCart[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = newQty;
      }
      
      return newCart;
    });
  };

  const setQuantityDirectly = (productId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setCart(prev => {
      const newCart = { ...prev };
      
      if (qty <= 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = qty;
      }
      
      return newCart;
    });
  };

  const addNewClient = async () => {
    if (!newClient.name || !newClient.address) {
      alert('Пожалуйста, заполните название и адрес клиента');
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
      
      alert('Клиент успешно создан!');
      
    } catch (error) {
      console.error('❌ Ошибка создания клиента:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert(`Ошибка создания клиента: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedClient || Object.keys(cart).length === 0) {
      alert('Выберите клиента и добавьте товары в заказ');
      return;
    }
    
    if (!currentAgent.id) {
      alert('Ошибка: не удалось определить пользователя');
      return;
    }

    // Проверяем, что выбранный клиент существует в списке
    const clientExists = clients.find(c => c.id === selectedClient);
    if (!clientExists) {
      alert('Ошибка: выбранный клиент не найден. Попробуйте обновить страницу.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      console.log('🔄 Создание заказа для клиента:', clientExists.name, 'ID:', selectedClient);
      
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
        console.error('❌ Ошибка создания заказа:', orderError);
        throw new Error(`Ошибка создания заказа: ${orderError.message}`);
      }
      
      if (!order) {
        throw new Error('Заказ не был создан');
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
        console.error('❌ Ошибка добавления позиций:', itemsError);
        // Попытаться удалить созданный заказ
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Ошибка добавления позиций: ${itemsError.message}`);
      }

      setSubmitStatus('success');
      setCart({});
      setComments({});
      
    } catch (error) {
      console.error('❌ Ошибка отправки заказа:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setSubmitStatus('error');
      alert(`Ошибка отправки заказа: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalItems = (): number => {
    return Object.values(cart).reduce((sum: number, qty: number) => sum + qty, 0);
  };

  const getTotalPrice = (): number => {
    return Object.entries(cart).reduce((sum: number, [productId, qty]: [string, number]) => {
      const product = products.find(p => p.id === productId);
      return sum + (product ? product.price * qty : 0);
    }, 0);
  };

  const currentProducts: Product[] = products.filter(p => p.category === selectedCategory);
  const selectedClientData = clients.find(c => c.id === selectedClient);

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage || 'Загрузка данных...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-blue-600" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Форма заказа</h1>
                <p className="text-gray-600">Оформление заказа для торговых точек</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {userRole === 'admin' ? 'Администратор:' : 'Торговый агент:'}
              </p>
              <p className="font-semibold text-gray-800">{currentAgent.name}</p>
              <p className="text-xs text-gray-500">{currentAgent.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Форма */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Каталог товаров */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold">Каталог товаров</h2>
              </div>
              
              {/* Категории */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Товары */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentProducts.map((product: Product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img 
                          src={product.image_url || '/default-product.png'} 
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setSelectedImage(product.image_url || '');
                            setShowImageModal(true);
                          }}
                        />
                        <Eye className="absolute top-1 right-1 text-white bg-black bg-opacity-50 rounded p-1" size={16} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                        <p className="text-blue-600 font-bold mb-2">{product.price} ₸ / {product.unit || 'шт'}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <button 
                            onClick={() => updateQuantity(product.id, -1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            disabled={!cart[product.id]}
                          >
                            <Minus size={16} />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={cart[product.id] || ''}
                            onChange={(e) => setQuantityDirectly(product.id, e.target.value)}
                            className="w-16 text-center font-semibold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          
                          <button 
                            onClick={() => updateQuantity(product.id, 1)}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {cart[product.id] && (
                          <input 
                            type="text"
                            placeholder="Комментарий..."
                            value={comments[product.id] || ''}
                            onChange={(e) => setComments(prev => ({...prev, [product.id]: e.target.value}))}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Информация о клиенте */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold">Информация о клиенте</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите точку продаж
                  </label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">Выберите клиента...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.address}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={() => setShowNewClientModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} />
                  Новая точка
                </button>

                {selectedClientData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800">{selectedClientData.name}</h3>
                    <p className="text-sm text-gray-600">Адрес: {selectedClientData.address}</p>
                    <p className="text-sm text-gray-600">Адрес: {selectedClientData.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая колонка - Сводка заказа */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Сводка заказа</h2>
              
              {selectedClientData && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold">{selectedClientData.name}</p>
                  <p className="text-xs text-gray-600">{selectedClientData.address}</p>
                </div>
              )}

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm"><strong>Дата создания заказа:</strong> {new Date().toLocaleDateString('ru-RU')}</p>
                <p className="text-sm"><strong>Время:</strong> {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Позиций в заказе:</span>
                  <span className="font-semibold">{getTotalItems()}</span>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">Общая сумма:</span>
                  <span className="text-lg font-bold text-blue-600">{getTotalPrice().toLocaleString()} ₸</span>
                </div>
              </div>

              {Object.keys(cart).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">Товары в заказе:</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    {/* Заголовок таблицы */}
                    <div className="bg-gray-200 px-3 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700">
                      <div className="col-span-5">Наименование</div>
                      <div className="col-span-2 text-center">Кол-во</div>
                      <div className="col-span-2 text-right">Цена</div>
                      <div className="col-span-3 text-right">Сумма</div>
                    </div>
                    
                    {/* Строки товаров */}
                    <div className="max-h-48 overflow-y-auto">
                      {Object.entries(cart).map(([productId, qty]) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        
                        const itemTotal = product.price * qty;
                        
                        return (
                          <div key={productId} className="px-3 py-2 grid grid-cols-12 gap-2 text-xs border-b border-gray-200 last:border-b-0">
                            <div className="col-span-5 truncate" title={product.name}>
                              {product.name}
                            </div>
                            <div className="col-span-2 text-center">
                              {qty} {product.unit || 'шт'}
                            </div>
                            <div className="col-span-2 text-right">
                              {product.price.toLocaleString()} ₸
                            </div>
                            <div className="col-span-3 text-right font-semibold">
                              {itemTotal.toLocaleString()} ₸
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Итого */}
                    <div className="bg-blue-50 px-3 py-2 grid grid-cols-12 gap-2 text-sm font-bold">
                      <div className="col-span-7">ИТОГО:</div>
                      <div className="col-span-2 text-center">{getTotalItems()} шт</div>
                      <div className="col-span-3 text-right text-blue-600">
                        {getTotalPrice().toLocaleString()} ₸
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button 
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedClient || Object.keys(cart).length === 0 || isSubmitting}
                onClick={handleSubmitOrder}
              >
                <Send size={16} />
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
              {submitStatus === 'success' && (
                <div className="text-green-600 text-center mt-2">Заявка успешно отправлена!</div>
              )}
              {submitStatus === 'error' && (
                <div className="text-red-600 text-center mt-2">Ошибка при отправке заявки. Попробуйте еще раз.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно нового клиента */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Новая точка продаж</h3>
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text"
                placeholder="Название магазина"
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({...prev, name: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <input 
                type="text"
                placeholder="Адрес точки"
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({...prev, address: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Отмена
              </button>
              <button 
                onClick={addNewClient}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newClient.name || !newClient.address || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создание...
                  </div>
                ) : (
                  'Добавить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно изображения */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Изображение товара</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <img 
              src={selectedImage} 
              alt="Товар"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFormPrototype;
