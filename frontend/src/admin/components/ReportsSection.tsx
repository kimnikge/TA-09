import React from 'react';
import { BarChart, TrendingUp, Users as UsersIcon, Package } from 'lucide-react';

const ReportsSection: React.FC = () => {
  console.log('📊 ReportsSection: Компонент загружается');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">Аналитика и отчёты</h2>
          <p className="text-sm text-gray-500 mt-1">
            Статистика и аналитические данные системы
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Всего пользователей</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Активных товаров</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Package className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Общий доход</p>
                <p className="text-2xl font-bold">₽0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Рост за месяц</p>
                <p className="text-2xl font-bold">0%</p>
              </div>
              <BarChart className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Раздел в разработке</h3>
          <p className="text-gray-500">
            Детальная аналитика и отчёты будут добавлены в следующих версиях
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;
