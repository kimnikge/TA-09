import React, { useState, useEffect, useCallback } from 'react';
import { Building, MapPin, Filter, Search, X, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Client {
  id: string;
  name: string;
  address: string;
  created_at: string;
  company?: string;
  shop?: string;
}

interface ClientsManagerBeautifulProps {
  onClientSelect?: (client: Client) => void;
  selectedClientId?: string;
  allowSelection?: boolean;
}

const ClientsManagerBeautiful: React.FC<ClientsManagerBeautifulProps> = ({ 
  onClientSelect, 
  selectedClientId, 
  allowSelection = false 
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры и поиск
  const [searchFilters, setSearchFilters] = useState({
    ip: '',
    shop: '',
    address: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Создание нового клиента
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    address: '',
    company: '',
    shop: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Загрузка клиентов
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, address, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка при загрузке клиентов:', error);
        return;
      }

      // Парсим данные для красивого отображения
      const processedClients = (data || []).map(client => {
        // Парсим название: "ИП Волконский - Алма" => ИП: "Волконский", Магазин: "Алма"
        const nameParts = client.name.split(' - ');
        let company = '';
        let shop = client.name;
        
        if (nameParts.length >= 2) {
          company = nameParts[0].replace(/^(ИП\s*|Компания\s*|ТОО\s*)/i, '').trim();
          shop = nameParts.slice(1).join(' - ');
        } else if (client.name.match(/^(ИП|Компания|ТОО)/i)) {
          company = client.name.replace(/^(ИП\s*|Компания\s*|ТОО\s*)/i, '').trim();
          shop = '';
        }
        
        return {
          ...client,
          company,
          shop
        };
      });

      setClients(processedClients);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Создание нового клиента
  const createNewClient = async () => {
    if (!newClientForm.shop.trim() || !newClientForm.address.trim()) {
      alert('Пожалуйста, заполните обязательные поля: название магазина и адрес');
      return;
    }

    try {
      setCreateLoading(true);
      
      // Формируем название клиента
      let clientName = '';
      if (newClientForm.company.trim()) {
        clientName = `ИП ${newClientForm.company.trim()}`;
        if (newClientForm.shop.trim()) {
          clientName += ` - ${newClientForm.shop.trim()}`;
        }
      } else if (newClientForm.name.trim()) {
        clientName = newClientForm.name.trim();
        if (newClientForm.shop.trim()) {
          clientName += ` - ${newClientForm.shop.trim()}`;
        }
      } else {
        // Если нет ни имени, ни ИП, используем только название магазина
        clientName = newClientForm.shop.trim();
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            name: clientName,
            address: newClientForm.address.trim()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Ошибка при создании клиента:', error);
        alert('Ошибка при создании клиента: ' + error.message);
        return;
      }

      // Добавляем нового клиента в список
      const newClient = {
        ...data,
        company: newClientForm.company.trim(),
        shop: newClientForm.shop.trim() // shop всегда заполнено, так как это обязательное поле
      };
      
      setClients(prev => [newClient, ...prev]);
      
      // Если разрешен выбор, автоматически выбираем созданного клиента
      if (allowSelection && onClientSelect) {
        onClientSelect(newClient);
      }
      
      // Очищаем форму и закрываем модал
      setNewClientForm({ name: '', address: '', company: '', shop: '' });
      setShowCreateModal(false);
      
      alert('Клиент успешно создан!');
    } catch (error) {
      console.error('Ошибка при создании клиента:', error);
      alert('Произошла ошибка при создании клиента');
    } finally {
      setCreateLoading(false);
    }
  };

  // Фильтрация клиентов
  const filteredClients = clients.filter(client => {
    if (searchFilters.ip && !client.company?.toLowerCase().includes(searchFilters.ip.toLowerCase()) && 
        !client.name.toLowerCase().includes(searchFilters.ip.toLowerCase())) {
      return false;
    }
    if (searchFilters.shop && !client.shop?.toLowerCase().includes(searchFilters.shop.toLowerCase()) && 
        !client.name.toLowerCase().includes(searchFilters.shop.toLowerCase())) {
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
          {allowSelection && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white border border-green-600 rounded-md shadow-sm text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Новый клиент
            </button>
          )}
          
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
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Поиск клиентов</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
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
              className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 overflow-hidden ${
                allowSelection 
                  ? selectedClientId === client.id 
                    ? 'border-l-green-500 ring-2 ring-green-200 cursor-pointer' 
                    : 'border-l-blue-500 hover:border-l-green-400 cursor-pointer'
                  : 'border-l-blue-500'
              }`}
              onClick={() => {
                if (allowSelection && onClientSelect) {
                  onClientSelect(client);
                }
              }}
            >
              <div className="p-6">
                {/* Заголовок карточки */}
                <div className="mb-4">
                  {client.company && (
                    <div className="flex items-center mb-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        ИП
                      </span>
                      <span className="ml-2 text-sm font-medium text-blue-700">
                        {client.company}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {client.shop ? `Магазин: ${client.shop}` : client.name}
                  </h3>
                  
                  <div className="flex items-start text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <p className="text-sm leading-relaxed">
                      {client.address}
                    </p>
                  </div>
                </div>

                {/* Разделитель */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Создан: {new Date(client.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    
                    {allowSelection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onClientSelect) {
                            onClientSelect(client);
                          }
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          selectedClientId === client.id 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                        }`}
                      >
                        {selectedClientId === client.id ? 'Выбран' : 'Выбрать'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Модальное окно создания клиента */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Создать нового клиента</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя клиента (необязательно)
                </label>
                <input
                  type="text"
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Имя или название"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ИП / Компания (необязательно)
                </label>
                <input
                  type="text"
                  value={newClientForm.company}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Название ИП или компании"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название магазина *
                </label>
                <input
                  type="text"
                  value={newClientForm.shop}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, shop: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    newClientForm.shop.trim() ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder="Название магазина"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес *
                </label>
                <textarea
                  value={newClientForm.address}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, address: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    newClientForm.address.trim() ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder="Полный адрес клиента"
                  rows={3}
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={createNewClient}
                disabled={createLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createLoading ? 'Создаю...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagerBeautiful;
