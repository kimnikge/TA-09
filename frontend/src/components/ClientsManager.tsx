import React, { useState, useEffect, memo, useCallback } from 'react';
import { Plus, Save, X, MapPin, Building } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Client {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
}

interface ClientsManagerProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  userRole: 'admin' | 'sales_rep';
}

const ClientsManager: React.FC<ClientsManagerProps> = ({ currentUser, userRole }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

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

      // Для торгового представителя показываем всех клиентов
      // (ранее показывали только созданных им, но это ограничивало функционал)
      // if (userRole === 'sales_rep') {
      //   query = query.eq('created_by', currentUser.id);
      // }

      const { data, error } = await query;

      if (error) throw error;      // Преобразуем данные в правильный формат
      const clientsData: Client[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        address: item.address,
        created_by: item.created_by,
        created_at: item.created_at
      }));

      setClients(clientsData);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
      console.error('Детали ошибки:', JSON.stringify(error, null, 2));
      // Заменяем alert на более информативное сообщение
      setClients([]); // Устанавливаем пустой массив вместо показа ошибки
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Пожалуйста, заполните обязательные поля: название и адрес');
      return;
    }

    setSubmitting(true);

    try {
      const clientData = {
        ...formData,
        created_by: currentUser.id
      };

      const { error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;

      // Обновляем список клиентов
      await loadClients();
      
      // Очищаем форму
      setFormData({
        name: '',
        address: ''
      });
      
      setShowAddForm(false);
      alert('Клиент успешно добавлен!');
      
    } catch (error) {
      console.error('Ошибка добавления клиента:', error);
      alert('Ошибка при добавлении клиента');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка клиентов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Торговые точки</h1>
          <p className="text-gray-600 mt-1">
            Управление клиентами и торговыми точками
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить точку
        </button>
      </div>

      {/* Форма добавления клиента */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Добавить новую торговую точку</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Название точки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Название магазина *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Магазин 'Алматы'"
                  required
                />
              </div>

              {/* Адрес */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Адрес точки *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="г. Алматы, ул. Абая, 123"
                  required
                />
              </div>

            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Добавление...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Добавить точку
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список клиентов */}
      <div className="bg-white rounded-lg shadow">
        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Торговых точек пока нет
            </h3>
            <p className="text-gray-500 mb-4">
              Добавьте первую торговую точку, чтобы начать работу
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Добавить точку
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                <div>Название магазина</div>
                <div>Адрес точки</div>
                <div>-</div>
                <div>Добавлено</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client.id} className="p-6 hover:bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{client.name}</h3>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{client.address}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">-</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(client.created_at).toLocaleDateString('ru-RU')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {userRole === 'admin' ? 'Торговый представитель' : currentUser.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Статистика */}
      {clients.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">
                Всего торговых точек: <span className="font-semibold">{clients.length}</span>
              </p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ClientsManager);
