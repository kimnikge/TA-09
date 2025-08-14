import React, { useState } from 'react';
import { Package, User, ShoppingCart, ArrowRight } from 'lucide-react';
import ProductSearch from './ProductSearch';
import ClientsManagerBeautiful from './ClientsManagerBeautiful';

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

// Компонент только для каталога товаров (шаг 1)
const ProductCatalogStep: React.FC = () => {
  const [products] = useState<Product[]>([]);

  const handleProductSelect = (product: Product) => {
    // TODO: Добавить логику добавления в корзину
    console.log('Выбран товар:', product);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Каталог товаров</h2>
      {/* Только поиск и каталог товаров, без лишних блоков */}
      <ProductSearch 
        products={products}
        onProductSelect={handleProductSelect}
        placeholder="Найти товар..."
      />
    </div>
  );
};

// Компонент только для выбора клиента (шаг 2)
const ClientSelectionStep: React.FC = () => {
  return (
    <div>
      {/* Только выбор/создание клиента */}
      <ClientsManagerBeautiful />
    </div>
  );
};

// Компонент только для сводки заказа (шаг 3)
const OrderSummaryStep: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Сводка заказа</h3>
      
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Товары в заказе:</h4>
          <p className="text-gray-600 text-sm">
            Здесь будет отображаться список выбранных товаров из корзины
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Клиент:</h4>
          <p className="text-gray-600 text-sm">
            Здесь будет отображаться информация о выбранном клиенте
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium">
          🚀 Отправить заказ
        </button>
      </div>
    </div>
  );
};

const ThreeStepOrderWrapper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('products');

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
          <ProductCatalogStep />
        )}

        {currentStep === 'client' && (
          <ClientSelectionStep />
        )}

        {currentStep === 'cart' && (
          <OrderSummaryStep />
        )}
      </div>
    </div>
  );
};

export default ThreeStepOrderWrapper;
