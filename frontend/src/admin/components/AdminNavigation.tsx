import React from 'react';
import { Users, Package, ShoppingCart, Settings, FileText } from 'lucide-react';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'orders', label: 'Заказы', icon: ShoppingCart },
    { id: 'reports', label: 'Отчёты', icon: FileText },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    console.log('🔄 AdminNavigation: Переключение на вкладку:', tabId);
    try {
      onTabChange(tabId);
    } catch (error) {
      console.error('❌ Ошибка при переключении вкладки:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-5 h-5 mr-2" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
