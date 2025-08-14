import React, { useState, useEffect } from 'react';
import { Package, User, ShoppingCart, ArrowRight } from 'lucide-react';
import ProductSearch from './ProductSearch';
import ClientsManagerBeautiful from './ClientsManagerBeautiful';
import CompactProductCard from './CompactProductCard';
import { supabase } from '../supabaseClient';

type Step = 'products' | 'client' | 'cart';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string | null;
  category: string;
  image_url?: string | null;
  active?: boolean;
}

interface Client {
  id: string;
  name: string;
  address: string;
  created_at: string;
  company?: string;
  shop?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ThreeStepOrderWrapperProps {
  currentUser: User;
}

// Компонент только для каталога товаров (шаг 1)
interface ProductCatalogStepProps {
  cart: { [key: string]: number };
  setCart: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  comments: { [key: string]: string };
  setComments: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  allProducts: Product[];
}

const ProductCatalogStep: React.FC<ProductCatalogStepProps> = ({ 
  cart, 
  setCart, 
  comments, 
  setComments, 
  allProducts 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Используем переданные товары или загружаем свои
  useEffect(() => {
    if (allProducts.length > 0) {
      setProducts(allProducts);
      
      // Создаём список категорий из товаров
      const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
      const categoryList = uniqueCategories.map(cat => ({
        id: cat,
        name: getCategoryName(cat)
      }));
      setCategories(categoryList);
      setLoading(false);
    } else {
      // Загружаем товары самостоятельно, если не переданы
      const loadData = async () => {
        try {
          setLoading(true);

          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('name');

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

        } catch (error) {
          console.error('Ошибка загрузки данных:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [allProducts]);

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

  const handleProductSelect = (product: Product) => {
    // Добавляем товар в корзину
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const newQuantity = (prev[productId] || 0) + delta;
      if (newQuantity <= 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: newQuantity };
    });
  };

  const setQuantityDirectly = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      });
    } else {
      setCart(prev => ({ ...prev, [productId]: quantity }));
    }
  };

  // Фильтруем товары по выбранной категории
  const currentProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : []; // Показываем пустой массив, если категория не выбрана

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Загрузка товаров...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Каталог товаров</h2>
      </div>
      
      {/* Поиск товаров */}
      <div className="mb-6">
        <ProductSearch
          products={products}
          onProductSelect={handleProductSelect}
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

      {/* Товары - компактные карточки */}
      {!selectedCategory ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Выберите категорию товаров</h3>
          <p className="text-gray-400">Нажмите на одну из категорий выше, чтобы просмотреть товары</p>
        </div>
      ) : (
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
                console.log('Клик по изображению:', imageUrl);
              }}
            />
          ))}
        </div>
      )}
      
      {/* Показать количество товаров */}
      {selectedCategory && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Показано {currentProducts.length} товаров в категории "{categories.find(c => c.id === selectedCategory)?.name}"
        </div>
      )}
      
      {/* Информация о корзине */}
      {Object.keys(cart).length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">
            В корзине: {Object.values(cart).reduce((sum, qty) => sum + qty, 0)} товаров
          </p>
        </div>
      )}
    </div>
  );
};

// Компонент только для выбора клиента (шаг 2)
interface ClientSelectionStepProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
}

const ClientSelectionStep: React.FC<ClientSelectionStepProps> = ({ selectedClient, onClientSelect }) => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Выбор клиента</h2>
        {selectedClient && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700 font-medium">Выбран клиент:</p>
            <p className="text-green-800">{selectedClient.name}</p>
            <p className="text-sm text-green-600">{selectedClient.address}</p>
          </div>
        )}
      </div>
      {/* Только выбор/создание клиента */}
      <ClientsManagerBeautiful 
        allowSelection={true}
        selectedClientId={selectedClient?.id}
        onClientSelect={onClientSelect}
      />
    </div>
  );
};

// Компонент только для сводки заказа (шаг 3)
interface OrderSummaryStepProps {
  cart: { [key: string]: number };
  comments: { [key: string]: string };
  products: Product[];
  selectedClient: Client | null;
  onSubmitOrder: () => void;
}

const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({ cart, comments, products, selectedClient, onSubmitOrder }) => {
  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return product ? { product, quantity, comment: comments[productId] || '' } : null;
  }).filter(Boolean);

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (item!.product.price * item!.quantity);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Сводка заказа</h3>
      
      <div className="space-y-4 mb-6">
        {/* Товары в заказе */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">Товары в заказе:</h4>
          {cartItems.length > 0 ? (
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item!.product.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item!.product.name}</p>
                    <p className="text-sm text-gray-500">{item!.product.price.toLocaleString('ru-RU')} тг за {item!.product.unit || 'шт'}</p>
                    {item!.comment && (
                      <p className="text-sm text-blue-600 italic">Комментарий: {item!.comment}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item!.quantity} {item!.product.unit || 'шт'}</p>
                    <p className="text-sm text-gray-600">{(item!.product.price * item!.quantity).toLocaleString('ru-RU')} тг</p>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Итого:</span>
                  <span className="text-green-600">{totalAmount.toLocaleString('ru-RU')} тг</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Корзина пуста. Добавьте товары на первом шаге.</p>
          )}
        </div>
        
        {/* Клиент */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Клиент:</h4>
          {selectedClient ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-700">Выбран клиент:</p>
              <p className="text-green-800">{selectedClient.name}</p>
              <p className="text-sm text-green-600">{selectedClient.address}</p>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Клиент не выбран. Выберите клиента на втором шаге.</p>
          )}
        </div>
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={onSubmitOrder}
          className={`px-6 py-3 rounded-lg font-medium ${
            cartItems.length > 0 && selectedClient
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={cartItems.length === 0 || !selectedClient}
        >
          🚀 Отправить заказ
        </button>
      </div>
    </div>
  );
};

const ThreeStepOrderWrapper: React.FC<ThreeStepOrderWrapperProps> = ({ currentUser }) => {
  const [currentStep, setCurrentStep] = useState<Step>('products');
  
  // Общие состояния для всех шагов
  const [globalCart, setGlobalCart] = useState<{ [key: string]: number }>({});
  const [globalComments, setGlobalComments] = useState<{ [key: string]: string }>({});
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Функция для обработки выбора клиента
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  // Функция для отправки заказа
  const handleSubmitOrder = async () => {
    if (!selectedClient || Object.keys(globalCart).length === 0) {
      alert('Невозможно отправить заказ: нет выбранного клиента или товаров в корзине');
      return;
    }

    try {
      // Подготавливаем данные заказа
      const orderItems = Object.entries(globalCart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        const comment = globalComments[productId] || '';
        
        return {
          product_id: productId,
          product_name: product?.name || 'Неизвестный товар',
          price: product?.price || 0,
          quantity,
          unit: product?.unit || 'шт',
          comment
        };
      });

      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalItemsCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

      // Создаем заказ в базе данных
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            client_id: selectedClient.id,
            rep_id: currentUser.id,
            total_price: totalAmount,
            total_items: totalItemsCount,
            delivery_date: new Date().toISOString().split('T')[0] // сегодняшняя дата
          }
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Ошибка при создании заказа:', orderError);
        alert('Ошибка при отправке заказа: ' + orderError.message);
        return;
      }

      // TODO: Нужно добавить сохранение товаров заказа в таблицу order_items
      // Для этого нужно проверить структуру таблицы order_items
      console.log('Товары заказа для сохранения:', orderItems);

      // Очищаем корзину и сбрасываем состояние
      setGlobalCart({});
      setGlobalComments({});
      setSelectedClient(null);
      setCurrentStep('products');

      alert(`Заказ успешно отправлен! ID заказа: ${orderData.id}`);
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error);
      alert('Произошла ошибка при отправке заказа');
    }
  };

  // Загружаем товары для всех компонентов
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('name');

        if (productsError) {
          console.error('Ошибка загрузки товаров:', productsError);
        } else {
          setProducts(productsData || []);
        }
      } catch (error) {
        console.error('Ошибка:', error);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Прогресс-бар */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Создание заказа (3 шага)</h1>

          {/* Прогресс-бар */}
          <div className="flex items-center space-x-4">
            {/* Шаг 1: Товары */}
            <button
              onClick={() => setCurrentStep('products')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentStep === 'products'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="font-medium">1. Каталог товаров</span>
            </button>

            <ArrowRight className="w-4 h-4 text-gray-400" />

            {/* Шаг 2: Клиент */}
            <button
              onClick={() => setCurrentStep('client')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentStep === 'client'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="font-medium">2. Добавить клиента</span>
            </button>

            <ArrowRight className="w-4 h-4 text-gray-400" />

            {/* Шаг 3: Корзина */}
            <button
              onClick={() => setCurrentStep('cart')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentStep === 'cart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium">3. Сводка заказа</span>
            </button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto p-4">
        {currentStep === 'products' && (
          <ProductCatalogStep 
            cart={globalCart}
            setCart={setGlobalCart}
            comments={globalComments}
            setComments={setGlobalComments}
            allProducts={products}
          />
        )}

        {currentStep === 'client' && (
          <ClientSelectionStep 
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
          />
        )}

        {currentStep === 'cart' && (
          <OrderSummaryStep
            cart={globalCart}
            comments={globalComments}
            products={products}
            selectedClient={selectedClient}
            onSubmitOrder={handleSubmitOrder}
          />
        )}
      </div>
    </div>
  );
};

export default ThreeStepOrderWrapper;
