import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, User, Package, Send, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ProductSearch from './ProductSearch';
import CompactProductCard from './CompactProductCard';

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
  const [addedProductNotification, setAddedProductNotification] = useState<string | null>(null);

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
    const product = products.find(p => p.id === productId);
    console.log('OrderForm: updateQuantity вызван', { productId, change, productName: product?.name });
    
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
        {/* Уведомление о добавлении товара */}
        {addedProductNotification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {addedProductNotification}
            </div>
          </div>
        )}
        
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
              
              {/* Поиск товаров */}
              <div className="mb-6">
                <ProductSearch
                  products={products}
                  onProductSelect={(product) => {
                    console.log('OrderForm: получен товар из поиска', product.name);
                    updateQuantity(product.id, 1);
                  }}
                  placeholder="Быстрый поиск товаров..."
                />
              </div>
              
              {/* Категории */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Выберите категорию товаров</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-base">
                        {category.name.includes('Молочн') && '🥛'}
                        {category.name.includes('Хлеб') && '🍞'}
                        {category.name.includes('Мяс') && '🥩'}
                        {category.name.includes('Овощ') && '🥬'}
                        {category.name.includes('Фрукт') && '🍎'}
                        {category.name.includes('Напитк') && '🥤'}
                        {category.name.includes('Конд') && '🍫'}
                        {category.name.includes('Рыб') && '🐟'}
                        {category.name.includes('Алко') && '🍷'}
                        {(!category.name.includes('Молочн') && 
                          !category.name.includes('Хлеб') && 
                          !category.name.includes('Мяс') && 
                          !category.name.includes('Овощ') && 
                          !category.name.includes('Фрукт') && 
                          !category.name.includes('Напитк') && 
                          !category.name.includes('Конд') && 
                          !category.name.includes('Рыб') && 
                          !category.name.includes('Алко')) && '📦'}
                      </span>
                      <span>{category.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {products.filter(p => p.category === category.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Товары - квадратные карточки */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
                {currentProducts.map((product: Product) => (
                  <CompactProductCard
                    key={product.id}
                    product={product}
                    quantity={cart[product.id] || 0}
                    comment={comments[product.id] || ''}
                    onQuantityChange={updateQuantity}
                    onQuantitySet={setQuantityDirectly}
                    onCommentChange={(productId, comment) => 
                      setComments(prev => ({ ...prev, [productId]: comment }))
                    }
                    onImageClick={(imageUrl) => {
                      setSelectedImage(imageUrl);
                      setShowImageModal(true);
                    }}
                  />
                ))}
              </div>
              
              {/* Показать количество товаров */}
              <div className="mt-4 text-sm text-gray-500 text-center">
                Показано {currentProducts.length} товаров в категории "{categories.find(c => c.id === selectedCategory)?.name}"
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
                  
                  {/* Улучшенный селектор клиентов */}
                  <div className="relative">
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <option value="">Выберите клиента...</option>
                      {clients.map(client => {
                        // Парсим название для красивого отображения
                        const nameParts = client.name.split(' - ');
                        const company = nameParts[0]?.replace(/^(ИП\s*|Компания\s*|ТОО\s*)/i, '').trim() || '';
                        const shop = nameParts.slice(1).join(' - ') || client.name;
                        
                        return (
                          <option key={client.id} value={client.id}>
                            {company ? `ИП ${company} - ${shop}` : shop} | {client.address}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowNewClientModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} />
                  Новая точка
                </button>

                {selectedClientData && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      {/* Извлекаем ИП и магазин */}
                      {(() => {
                        const nameParts = selectedClientData.name.split(' - ');
                        const company = nameParts[0]?.replace(/^(ИП\s*|Компания\s*|ТОО\s*)/i, '').trim();
                        const shop = nameParts.slice(1).join(' - ') || selectedClientData.name;
                        
                        return (
                          <>
                            {company && (
                              <div className="flex items-center">
                                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full mr-2">
                                  ИП
                                </span>
                                <span className="text-sm font-medium text-blue-700">{company}</span>
                              </div>
                            )}
                            <h3 className="font-semibold text-gray-800 text-lg">
                              Магазин: {shop}
                            </h3>
                            <div className="flex items-start text-gray-600">
                              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm">{selectedClientData.address}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
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
                  <span className="text-lg font-bold text-blue-600">{getTotalPrice().toLocaleString()} тг</span>
                </div>
              </div>

              {Object.keys(cart).length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="text-green-600" size={16} />
                    <h3 className="text-sm font-semibold">Товары в заказе:</h3>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      {getTotalItems()} шт
                    </span>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Заголовок таблицы */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 grid grid-cols-12 gap-3 text-xs font-semibold text-gray-700 border-b border-gray-200">
                      <div className="col-span-5">Наименование</div>
                      <div className="col-span-3 text-center">Количество</div>
                      <div className="col-span-2 text-right">Цена</div>
                      <div className="col-span-2 text-right">Сумма</div>
                    </div>
                    
                    {/* Строки товаров */}
                    <div className="max-h-48 overflow-y-auto">
                      {Object.entries(cart).map(([productId, qty]) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        
                        const itemTotal = product.price * qty;
                        
                        return (
                          <div key={productId} className="px-4 py-3 grid grid-cols-12 gap-3 text-xs border-b border-gray-100 last:border-b-0 hover:bg-gray-25 transition-colors">
                            <div className="col-span-5 flex flex-col">
                              <div className="truncate font-medium text-gray-800" title={product.name}>
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {product.price.toLocaleString()} тг за {product.unit || 'шт'}
                              </div>
                            </div>
                            <div className="col-span-3 flex flex-col items-center gap-2">
                              {/* Кнопки управления количеством */}
                              <div className="flex items-center gap-2 w-full">
                                <button 
                                  onClick={() => updateQuantity(productId, -1)}
                                  className="cart-button w-7 h-7 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-full text-sm flex items-center justify-center transition-all duration-150 hover:scale-110 shadow-sm"
                                  title="Уменьшить количество"
                                >
                                  −
                                </button>
                                
                                <div className="flex-1 flex flex-col items-center">
                                  <input
                                    type="number"
                                    value={cart[productId] === 0 ? '' : cart[productId]}
                                    onChange={(e) => setQuantityDirectly(productId, e.target.value)}
                                    onBlur={(e) => handleQuantityBlur(productId, e.target.value)}
                                    className="cart-input w-14 h-7 text-center border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                                    min="1"
                                    placeholder="1"
                                  />
                                  <span className="text-xs text-gray-400 mt-1">{product.unit || 'шт'}</span>
                                </div>
                                
                                <button 
                                  onClick={() => updateQuantity(productId, 1)}
                                  className="cart-button w-7 h-7 bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-600 rounded-full text-sm flex items-center justify-center transition-all duration-150 hover:scale-110 shadow-sm"
                                  title="Увеличить количество"
                                >
                                  +
                                </button>
                              </div>
                              
                              {/* Кнопка удаления */}
                              <button 
                                onClick={() => {
                                  setCart(prev => {
                                    const newCart = { ...prev };
                                    delete newCart[productId];
                                    return newCart;
                                  });
                                  setAddedProductNotification(`${product.name} удален из корзины`);
                                  setTimeout(() => setAddedProductNotification(null), 3000);
                                }}
                                className="cart-button w-16 h-5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-full text-xs flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm"
                                title="Удалить товар"
                              >
                                Удалить
                              </button>
                            </div>
                            <div className="col-span-2 text-right self-center">
                              <div className="font-medium text-gray-700">
                                {product.price.toLocaleString()} тг
                              </div>
                            </div>
                            <div className="col-span-2 text-right self-center">
                              <div className="font-bold text-green-600 text-sm">
                                {itemTotal.toLocaleString()} тг
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Итого */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-4 grid grid-cols-12 gap-3 text-sm border-t border-green-200">
                      <div className="col-span-8 flex items-center">
                        <span className="font-bold text-gray-800 text-base">ИТОГО:</span>
                        <div className="ml-3 flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            {getTotalItems()} товаров
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-gray-600 font-medium">{getTotalItems()} шт</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-bold text-green-700 text-lg">
                          {getTotalPrice().toLocaleString()} тг
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button 
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    !selectedClient || Object.keys(cart).length === 0 || isSubmitting
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                  }`}
                  disabled={!selectedClient || Object.keys(cart).length === 0 || isSubmitting}
                  onClick={handleSubmitOrder}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Отправка заявки...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Отправить заявку
                      {Object.keys(cart).length > 0 && (
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                          {getTotalItems()} товаров
                        </span>
                      )}
                    </>
                  )}
                </button>
                
                {/* Статус отправки */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Заявка успешно отправлена!
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Ошибка при отправке заявки. Попробуйте еще раз.
                  </div>
                )}
              </div>
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
