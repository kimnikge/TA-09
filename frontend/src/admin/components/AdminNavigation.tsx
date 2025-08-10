import React from 'react';
import { Users, Package, ShoppingCart, Settings, FileText } from 'lucide-react';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  newOrdersCount?: number;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  newOrdersCount = 0
}) => {
  const navItems = [
    { id: 'users', label: 'Агенты', icon: Users },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'orders', label: 'Заказы', icon: ShoppingCart },
    { id: 'reports', label: 'Отчёты', icon: FileText },
    { id: 'tests', label: 'Тесты', icon: FileText },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    console.log('🔄 AdminNavigation: Переключение на вкладку:', tabId);
    try {
      onTabChange(tabId);
      // Закрываем мобильное меню после выбора
      if (setIsMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    } catch (error) {
      console.error('❌ Ошибка при переключении вкладки:', error);
    }
  };

  return (
    <>
      {/* Десктопная навигация */}
      <nav className="bg-white shadow-sm border-b hidden sm:block">
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
                  {item.id === 'orders' && newOrdersCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                      {newOrdersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Мобильная навигация */}
      <div className={`sm:hidden bg-white border-b shadow-sm ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-5 h-5 mr-3" />
                {item.label}
                {item.id === 'orders' && newOrdersCount > 0 && (
                  <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                    {newOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AdminNavigation;
