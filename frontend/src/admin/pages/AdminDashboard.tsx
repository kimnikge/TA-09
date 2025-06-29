import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import AdminNavigation from '../components/AdminNavigation';
import UsersSection from './UsersSection';
import ProductsSection from '../components/ProductsSection';
import OrdersSection from '../components/OrdersSection';
import ReportsSection from '../components/ReportsSection';
import SettingsSection from '../components/SettingsSection';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  console.log('🎯 AdminDashboard: Рендеринг с активной вкладкой:', activeTab);

  // Обёртка для setActiveTab с логированием
  const handleTabChange = (newTab: string) => {
    console.log('🔄 AdminDashboard: Смена вкладки с', activeTab, 'на', newTab);
    setActiveTab(newTab);
    console.log('✅ AdminDashboard: Вкладка изменена на', newTab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок админки */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Админ-панель</h1>
                <p className="text-sm text-gray-500">Система управления</p>
              </div>
            </div>
            
            {/* Индикатор статуса */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Система работает</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <AdminNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Контент активной вкладки */}
        <div className="space-y-6">
          {activeTab === 'users' && <UsersSection />}
          {activeTab === 'products' && <ProductsSection />}
          {activeTab === 'orders' && <OrdersSection />}
          {activeTab === 'reports' && <ReportsSection />}
          {activeTab === 'settings' && <SettingsSection />}
        </div>
      </main>

      {/* Подвал */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2024 Админ-панель. Модульная архитектура v1.0
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>React + TypeScript</span>
              <span>•</span>
              <span>Supabase</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
