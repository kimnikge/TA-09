import React from 'react';
import { ShoppingCart, Filter, Calendar } from 'lucide-react';

const OrdersSection: React.FC = () => {
  console.log('🛒 OrdersSection: Компонент загружается');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Управление заказами</h2>
            <p className="text-sm text-gray-500 mt-1">
              Просматривайте и управляйте заказами клиентов
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
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-800">Новые заказы</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-yellow-800">В обработке</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-green-800">Выполнены</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-sm text-red-800">Отменены</div>
          </div>
        </div>

        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Раздел в разработке</h3>
          <p className="text-gray-500">
            Функциональность управления заказами будет добавлена в следующих версиях
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrdersSection;
