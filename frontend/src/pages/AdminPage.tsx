import React, { useState, useEffect } from 'react';
import { 
  Users, Package, ShoppingCart, BarChart3, Settings, FileText, 
  Plus, Edit, Trash2, CheckCircle, Clock, UserX
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// Временный тип для демо-данных
type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales_rep';
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  orders: number;
};

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<DemoUser | null>(null);

  const navigationTabs = [
    { id: 'dashboard', label: 'Дашборд', icon: BarChart3 },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'orders', label: 'Заказы', icon: ShoppingCart },
    { id: 'clients', label: 'Клиенты', icon: Users },
    { id: 'reports', label: 'Отчеты', icon: FileText },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Демо-данные для показа интерфейса
      setUsers([
        { id: '1', name: 'Алексей Петров', email: 'alexey@example.com', role: 'sales_rep', status: 'active', lastActive: '2024-06-28', orders: 45 },
        { id: '2', name: 'Мария Сидорова', email: 'maria@example.com', role: 'sales_rep', status: 'pending', lastActive: '2024-06-27', orders: 32 },
        { id: '3', name: 'Дмитрий Козлов', email: 'dmitry@example.com', role: 'sales_rep', status: 'inactive', lastActive: '2024-06-25', orders: 12 }
      ]);
    } catch (error) {
      setMessage('Ошибка загрузки пользователей: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: false })
        .eq('id', userId);
      
      if (error) throw error;
      
      setMessage('Пользователь заблокирован');
      setTimeout(() => setMessage(''), 3000);
      await loadUsers();
    } catch (error) {
      setMessage('Ошибка блокировки: ' + (error as Error).message);
    }
  };

  const renderDashboard = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Дашборд</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Всего пользователей</h3>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Активные пользователи</h3>
              <p className="text-2xl font-bold text-gray-900">{users.filter(user => user.status === 'active').length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Ожидающие подтверждения</h3>
              <p className="text-2xl font-bold text-gray-900">{users.filter(user => user.status === 'pending').length}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Заблокированные пользователи</h3>
              <p className="text-2xl font-bold text-gray-900">{users.filter(user => user.status === 'inactive').length}</p>
            </div>
            <UserX className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Пользователи</h2>
      
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => {
            setModalType('addUser');
            setShowModal(true);
          }}
          className="mt-3 sm:mt-0 sm:ml-3 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Добавить пользователя
        </button>
      </div>
      
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('Ошибка') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <span className="text-gray-500 font-medium">{user.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Администратор' : 'Торговый представитель'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Активен' : user.status === 'pending' ? 'Ожидает' : 'Заблокирован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(user);
                          setModalType('editUser');
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Редактировать"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => blockUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Заблокировать"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Товары</h2>
      {/* ...таблица товаров... */}
    </div>
  );

  const renderOrders = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Заказы</h2>
      {/* ...таблица заказов... */}
    </div>
  );

  const renderClients = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Клиенты</h2>
      {/* ...таблица клиентов... */}
    </div>
  );

  const renderModal = () => {
    switch (modalType) {
      case 'addUser':
        return (
          <div className={`fixed inset-0 z-50 overflow-y-auto ${showModal ? '' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Добавить пользователя</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите имя пользователя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Роль
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="sales_rep">Торговый представитель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      // ...логика добавления пользователя...
                      setShowModal(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'editUser':
        return (
          <div className={`fixed inset-0 z-50 overflow-y-auto ${showModal ? '' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Редактировать пользователя</h3>
                {selectedItem && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Имя
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedItem.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={selectedItem.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Роль
                      </label>
                      <select 
                        defaultValue={selectedItem.role}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="sales_rep">Торговый представитель</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      // ...логика редактирования пользователя...
                      setShowModal(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Админ-панель
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">АП</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Админ Панель</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="space-y-2">
                {navigationTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'clients' && renderClients()}
            {activeTab === 'reports' && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Отчеты</h3>
                <p className="text-gray-600">Раздел отчетов в разработке</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Настройки</h3>
                <p className="text-gray-600">Раздел настроек в разработке</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default AdminPage;