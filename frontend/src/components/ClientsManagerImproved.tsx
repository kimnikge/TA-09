import React, { useState, useEffect, memo, useCallback } from 'react';
import { Plus, MapPin, Building, Search, Filter, X, RefreshCw, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Client {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  company?: string; // ИП
  shop?: string; // Название магазина
}

interface ClientsManagerProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  userRole: 'admin' | 'sales_rep';
}

const ClientsManagerImproved: React.FC<ClientsManagerProps> = ({ userRole }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры и поиск
  const [searchFilters, setSearchFilters] = useState({
    ip: '',
    shop: '',
    address: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Модальные состояния
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Уведомления  
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 3000);
  };

  // Загрузка клиентов
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      
      const query = supabase
        .from('clients')
        .select(`
          id, 
          name, 
          address, 
          created_by, 
          created_at
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Ошибка при загрузке клиентов:', error);
        showAlert('error', 'Ошибка загрузки клиентов');
        return;
      }

      // Получаем информацию о мягком удалении из localStorage
      const deletedClients = JSON.parse(localStorage.getItem('deletedClients') || '{}');
      
      const clientsWithStatus = (data || []).map(client => {
        // Парсим данные из name и address для красивого отображения
        const parts = client.name.split(' - ');
        const company = parts[0] || '';
        const shop = parts[1] || client.name;
        
        return {
          ...client,
          company,
          shop,
          is_deleted: deletedClients[client.id]?.is_deleted || false,
          deleted_at: deletedClients[client.id]?.deleted_at || null,
          deleted_by: deletedClients[client.id]?.deleted_by || null
        };
      });

      setClients(clientsWithStatus);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
      showAlert('error', 'Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Фильтрация клиентов
  const filteredClients = clients.filter(client => {
    // Фильтр по статусу (удаленные/активные)
    if (showDeleted && !client.is_deleted) return false;
    if (!showDeleted && client.is_deleted) return false;

    // Поисковые фильтры
    if (searchFilters.ip && !client.company?.toLowerCase().includes(searchFilters.ip.toLowerCase())) {
      return false;
    }
    if (searchFilters.shop && !client.name?.toLowerCase().includes(searchFilters.shop.toLowerCase())) {
      return false;
    }
    if (searchFilters.address && !client.address?.toLowerCase().includes(searchFilters.address.toLowerCase())) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchFilters({ ip: '', shop: '', address: '' });
  };

  const hasActiveFilters = searchFilters.ip || searchFilters.shop || searchFilters.address;

  // Остальные функции (создание, редактирование, удаление) остаются такими же...
  // [Здесь будут функции handleSoftDelete, handleRestore, etc.]

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Building className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Клиенты</h2>
            <p className="text-sm text-gray-500">
              Найдено: {filteredClients.length} из {clients.length}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
              hasActiveFilters 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-blue-600 text-xs px-2 py-1 rounded-full">
                {Object.values(searchFilters).filter(Boolean).length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {
              // Функции добавления клиента пока нет
              console.log('Добавить клиента');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить клиента
          </button>
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Поиск клиентов</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Очистить
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ИП / Компания
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchFilters.ip}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="Например: Волконский"
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Магазин
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchFilters.shop}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, shop: e.target.value }))}
                  placeholder="Например: Береке"
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Адрес
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchFilters.address}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Например: Строителей"
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Переключатель удаленных клиентов */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDeleted(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !showDeleted 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Активные ({clients.filter(c => !c.is_deleted).length})
          </button>
          <button
            onClick={() => setShowDeleted(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showDeleted 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Удаленные ({clients.filter(c => c.is_deleted).length})
          </button>
        </div>
      </div>

      {/* Список клиентов */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'Клиенты не найдены' : 'Нет клиентов'}
          </h3>
          <p className="text-gray-500">
            {hasActiveFilters 
              ? 'Попробуйте изменить параметры поиска' 
              : 'Добавьте первого клиента для начала работы'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 border-l-4 ${
                client.is_deleted 
                  ? 'border-l-red-400 opacity-60' 
                  : 'border-l-blue-400'
              }`}
            >
              <div className="p-5">
                {/* Заголовок карточки */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {client.company && (
                      <p className="text-sm font-medium text-blue-600 mb-1">
                        ИП: {client.company}
                      </p>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Магазин: {client.shop || client.name}
                    </h3>
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">
                        {client.address}
                      </p>
                    </div>
                  </div>
                  
                  {client.is_deleted && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Удален
                    </span>
                  )}
                </div>

                {/* Разделитель */}
                <div className="border-t border-gray-100 my-4"></div>

                {/* Нижняя часть карточки */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Создан: {new Date(client.created_at).toLocaleDateString('ru-RU')}
                  </p>
                  
                  <div className="flex gap-2">
                    {client.is_deleted ? (
                      <>
                        <button
                          onClick={() => console.log('Восстановить клиента')}
                          className="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => console.log('Удалить навсегда')}
                            className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => console.log('Редактировать клиента')}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log('Удалить клиента')}
                          className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Уведомления */}
      {alert.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          alert.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Модальные окна будут добавлены позже... */}
    </div>
  );
};

export default memo(ClientsManagerImproved);
